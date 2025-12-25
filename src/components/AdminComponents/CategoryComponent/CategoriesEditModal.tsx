import React, { useEffect, useState } from 'react';
import type { CategoryDetailData, CategoryTreeNode, UpdateCategoryRequest, CategoryAttribute, CategoryAttributeToAdd, CategoryAttributeToUpdate } from '../../../types/api';
import { AdminCategoryService } from '../../../services/admin/AdminCategoryService';
import { Select, Button, Input, Tag, Space, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Option } = Select;

interface CategoriesEditModalProps {
  open: boolean;
  initial: CategoryDetailData | null;
  onClose: () => void;
  onUpdate: (payload: UpdateCategoryRequest) => Promise<void> | void;
}

const CategoriesEditModal: React.FC<CategoriesEditModalProps> = ({ open, initial, onClose, onUpdate }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Attributes management
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributesToAdd, setAttributesToAdd] = useState<CategoryAttributeToAdd[]>([]);
  const [attributesToUpdate, setAttributesToUpdate] = useState<CategoryAttributeToUpdate[]>([]);
  const [attributesToDelete, setAttributesToDelete] = useState<string[]>([]);
  
  // Form for adding new attribute
  const [newAttribute, setNewAttribute] = useState<CategoryAttributeToAdd>({
    attributeName: '',
    attributeLabel: '',
    dataType: 'STRING',
    options: []
  });
  
  // Options input for new attribute
  const [newAttributeOptionsInput, setNewAttributeOptionsInput] = useState<string>('');
  
  // Options input for editing attribute
  const [editingOptionInput, setEditingOptionInput] = useState<string>('');
  
  // Editing state
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttributeToUpdate | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load category tree for parent selection
  useEffect(() => {
    if (open) {
      const loadCategories = async () => {
        setLoadingCategories(true);
        try {
          const res = await AdminCategoryService.getCategoryTree();
          if (res.data) {
            // Filter out current category and its children to prevent circular reference
            const filtered = res.data.filter(cat => cat.categoryId !== initial?.categoryId);
            setCategories(filtered);
          }
        } catch (err) {
          console.error('Failed to load categories:', err);
        } finally {
          setLoadingCategories(false);
        }
      };
      loadCategories();
    }
  }, [open, initial?.categoryId]);

  // Initialize form when modal opens
  useEffect(() => {
    if (initial && open) {
      setName(initial.name);
      setParentId(initial.parentId);
      setAttributes([...initial.attributes]);
      setAttributesToAdd([]);
      setAttributesToUpdate([]);
      setAttributesToDelete([]);
      setEditingAttributeId(null);
      setEditingAttribute(null);
      setEditingOptionInput('');
      setNewAttribute({ attributeName: '', attributeLabel: '', dataType: 'STRING', options: [] });
      setNewAttributeOptionsInput('');
    }
  }, [initial, open]);

  if (!open) return null;

  // Flatten category tree for dropdown
  const flattenCategories = (nodes: CategoryTreeNode[], excludeId?: string): { value: string; label: string }[] => {
    const result: { value: string; label: string }[] = [];
    nodes.forEach(node => {
      if (node.categoryId !== excludeId) {
        result.push({ value: node.categoryId, label: node.name });
        if (node.children && node.children.length > 0) {
          const children = flattenCategories(node.children, excludeId);
          children.forEach(child => {
            result.push({ value: child.value, label: `  └─ ${child.label}` });
          });
        }
      }
    });
    return result;
  };

  const categoryOptions = flattenCategories(categories, initial?.categoryId);

  const handleAddAttribute = () => {
    if (!newAttribute.attributeName.trim() || !newAttribute.attributeLabel.trim()) {
      setError('Vui lòng điền đầy đủ tên và nhãn thuộc tính');
      return;
    }
    
    // Parse options from input (comma or newline separated)
    const options = newAttributeOptionsInput
      .split(/[,\n]/)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    
    const attributeToAdd: CategoryAttributeToAdd = {
      ...newAttribute,
      // Only include options if dataType is SELECT and has options
      options: newAttribute.dataType === 'SELECT' && options.length > 0 ? options : undefined
    };
    
    setAttributesToAdd([...attributesToAdd, attributeToAdd]);
    setNewAttribute({ attributeName: '', attributeLabel: '', dataType: 'STRING', options: [] });
    setNewAttributeOptionsInput('');
    setError(null);
  };

  const handleStartEditAttribute = (attr: CategoryAttribute) => {
    setEditingAttributeId(attr.attributeId);
    setEditingAttribute({
      attributeId: attr.attributeId,
      attributeName: attr.attributeName,
      attributeLabel: attr.attributeLabel,
      dataType: attr.dataType,
      options: attr.options ? [...attr.options] : undefined
    });
    setEditingOptionInput(''); // Reset input when starting to edit
  };

  const handleSaveEditAttribute = () => {
    if (!editingAttribute || !editingAttribute.attributeName.trim() || !editingAttribute.attributeLabel.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    // Prepare editingAttribute for payload: if options is empty array, keep it to clear options; if undefined, don't include
    const attributeForUpdate: CategoryAttributeToUpdate = {
      attributeId: editingAttribute.attributeId,
      attributeName: editingAttribute.attributeName,
      attributeLabel: editingAttribute.attributeLabel,
      dataType: editingAttribute.dataType,
      // Only include options if it's defined (empty array means clear options, array with values means update)
      ...(editingAttribute.options !== undefined && { options: editingAttribute.options })
    };
    
    // Update the attribute in attributesToUpdate with the prepared attribute
    const existingIndex = attributesToUpdate.findIndex(a => a.attributeId === editingAttribute.attributeId);
    if (existingIndex >= 0) {
      const updated = [...attributesToUpdate];
      updated[existingIndex] = attributeForUpdate;
      setAttributesToUpdate(updated);
    } else {
      setAttributesToUpdate([...attributesToUpdate, attributeForUpdate]);
    }
    
    // Update local attributes display
    const updatedAttributes = attributes.map(attr => 
      attr.attributeId === editingAttribute.attributeId 
        ? { 
            ...attr, 
            attributeName: editingAttribute.attributeName,
            attributeLabel: editingAttribute.attributeLabel,
            dataType: editingAttribute.dataType,
            // Preserve options: if empty array, it means clear options; if undefined, keep original
            options: editingAttribute.options !== undefined 
              ? (editingAttribute.options.length > 0 ? editingAttribute.options : [])
              : attr.options
          }
        : attr
    );
    setAttributes(updatedAttributes);
    
    setEditingAttributeId(null);
    setEditingAttribute(null);
    setError(null);
  };

  const handleCancelEditAttribute = () => {
    setEditingAttributeId(null);
    setEditingAttribute(null);
    setEditingOptionInput('');
    setError(null);
  };

  const handleDeleteAttribute = (attributeId: string) => {
    // Remove from local display
    setAttributes(attributes.filter(attr => attr.attributeId !== attributeId));
    
    // Remove from update list if exists
    setAttributesToUpdate(attributesToUpdate.filter(a => a.attributeId !== attributeId));
    
    // Add to delete list if not already there
    if (!attributesToDelete.includes(attributeId)) {
      setAttributesToDelete([...attributesToDelete, attributeId]);
    }
  };

  const handleRemoveAddedAttribute = (index: number) => {
    setAttributesToAdd(attributesToAdd.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Build payload according to API specification: PUT /api/categories/{categoryId}
      // Only include fields that have values (don't send undefined or empty arrays)
      const payload: UpdateCategoryRequest = {
        name: name.trim(),
        parentId: parentId || null,
      };
      
      // Filter out any attributes from attributesToUpdate that are also in attributesToDelete
      // (should not happen, but just to be safe)
      const validAttributesToUpdate = attributesToUpdate.filter(
        attr => !attributesToDelete.includes(attr.attributeId)
      );
      
      // Only add attributesToAdd if there are items to add
      if (attributesToAdd.length > 0) {
        payload.attributesToAdd = attributesToAdd;
      }
      
      // Only add attributesToUpdate if there are items to update (and not deleted)
      if (validAttributesToUpdate.length > 0) {
        payload.attributesToUpdate = validAttributesToUpdate;
      }
      
      // Only add attributesToDelete if there are items to delete
      if (attributesToDelete.length > 0) {
        payload.attributesToDelete = attributesToDelete;
      }
      
      console.log('📤 Sending update category request:', {
        name: payload.name,
        parentId: payload.parentId,
        attributesToAdd: payload.attributesToAdd?.length || 0,
        attributesToUpdate: payload.attributesToUpdate?.length || 0,
        attributesToDelete: payload.attributesToDelete?.length || 0,
        fullPayload: payload
      });
      
      await onUpdate(payload);
      onClose();
    } catch (err: any) {
      console.error('❌ Error updating category:', err);
      setError(err?.message || 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Chỉnh sửa danh mục</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-700">Thông tin cơ bản</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên danh mục"
                required
                size="large"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
              <Select
                value={parentId}
                onChange={(value) => setParentId(value)}
                placeholder="Chọn danh mục cha (tùy chọn)"
                allowClear
                style={{ width: '100%' }}
                size="large"
                loading={loadingCategories}
              >
                <Option value={null}>Không có (Danh mục gốc)</Option>
                {categoryOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <Divider />

          {/* Attributes Management */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-700">
              Thuộc tính ({attributes.length + attributesToAdd.length})
            </h4>

            {/* Existing Attributes */}
            {attributes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Thuộc tính hiện có:</p>
                <div className="space-y-2">
                  {attributes.map((attr) => {
                    const isEditing = editingAttributeId === attr.attributeId;
                    const isDeleted = attributesToDelete.includes(attr.attributeId);
                    
                    if (isDeleted) return null;
                    
                    return (
                      <div key={attr.attributeId} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingAttribute?.attributeName || ''}
                              onChange={(e) => setEditingAttribute({
                                ...editingAttribute!,
                                attributeName: e.target.value
                              })}
                              placeholder="Tên thuộc tính"
                              size="small"
                            />
                            <Input
                              value={editingAttribute?.attributeLabel || ''}
                              onChange={(e) => setEditingAttribute({
                                ...editingAttribute!,
                                attributeLabel: e.target.value
                              })}
                              placeholder="Nhãn hiển thị"
                              size="small"
                            />
                            <Select
                              value={editingAttribute?.dataType}
                              onChange={(value) => setEditingAttribute({
                                ...editingAttribute!,
                                dataType: value,
                                // Keep options if changing to STRING or SELECT, clear for other types
                                options: (value === 'SELECT' || value === 'STRING') ? (editingAttribute?.options || []) : undefined
                              })}
                              style={{ width: '100%' }}
                              size="small"
                            >
                              <Option value="STRING">STRING</Option>
                              <Option value="NUMBER">NUMBER</Option>
                              <Option value="BOOLEAN">BOOLEAN</Option>
                              <Option value="DATE">DATE</Option>
                              <Option value="DECIMAL">DECIMAL</Option>
                              <Option value="SELECT">SELECT</Option>
                            </Select>
                            {/* Show options management for SELECT type or if attribute has options */}
                            {(editingAttribute?.dataType === 'SELECT' || (editingAttribute?.options && editingAttribute.options.length > 0)) && (
                              <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-medium">Tùy chọn:</label>
                                
                                {/* Display existing options with delete buttons */}
                                {editingAttribute.options && editingAttribute.options.length > 0 && (
                                  <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                    {editingAttribute.options.map((opt, idx) => (
                                      <Tag
                                        key={idx}
                                        closable
                                        onClose={(e) => {
                                          e.preventDefault();
                                          const newOptions = editingAttribute.options?.filter((_, i) => i !== idx) || [];
                                          setEditingAttribute({
                                            ...editingAttribute!,
                                            options: newOptions.length > 0 ? newOptions : []
                                          });
                                        }}
                                        color="blue"
                                        className="mb-0"
                                      >
                                        {opt}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Add new option input */}
                                <div className="flex gap-2">
                                  <Input
                                    value={editingOptionInput}
                                    onChange={(e) => setEditingOptionInput(e.target.value)}
                                    placeholder="Nhập tùy chọn mới"
                                    size="small"
                                    onPressEnter={(e) => {
                                      e.preventDefault();
                                      const value = editingOptionInput.trim();
                                      if (value && !editingAttribute.options?.includes(value)) {
                                        setEditingAttribute({
                                          ...editingAttribute!,
                                          options: [...(editingAttribute.options || []), value]
                                        });
                                        setEditingOptionInput('');
                                      }
                                    }}
                                  />
                                  <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={() => {
                                      const value = editingOptionInput.trim();
                                      if (value && !editingAttribute.options?.includes(value)) {
                                        setEditingAttribute({
                                          ...editingAttribute!,
                                          options: [...(editingAttribute.options || []), value]
                                        });
                                        setEditingOptionInput('');
                                      }
                                    }}
                                  >
                                    Thêm
                                  </Button>
                                </div>
                                
                                <p className="text-xs text-gray-500">
                                  Nhấn Enter hoặc nút "Thêm" để thêm tùy chọn mới. Click vào tag để xóa.
                                </p>
                              </div>
                            )}
                            <Space>
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={handleSaveEditAttribute}
                                size="small"
                              >
                                Lưu
                              </Button>
                              <Button
                                icon={<CloseOutlined />}
                                onClick={handleCancelEditAttribute}
                                size="small"
                              >
                                Hủy
                              </Button>
                            </Space>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{attr.attributeLabel}</span>
                                <Tag color={
                                  attr.dataType === 'STRING' ? 'blue' :
                                  attr.dataType === 'NUMBER' ? 'green' :
                                  attr.dataType === 'BOOLEAN' ? 'orange' :
                                  attr.dataType === 'DATE' ? 'purple' : 'default'
                                }>
                                  {attr.dataType}
                                </Tag>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{attr.attributeName}</p>
                              {attr.options && attr.options.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {attr.options.map((opt, idx) => (
                                    <Tag key={idx} color="geekblue" className="text-xs">
                                      {opt}
                                    </Tag>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Space>
                              <Button
                                icon={<EditOutlined />}
                                onClick={() => handleStartEditAttribute(attr)}
                                size="small"
                              >
                                Sửa
                              </Button>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteAttribute(attr.attributeId)}
                                size="small"
                              >
                                Xóa
                              </Button>
                            </Space>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Attributes to Add */}
            {attributesToAdd.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Thuộc tính mới sẽ thêm:</p>
                {attributesToAdd.map((attr, index) => (
                  <div key={index} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{attr.attributeLabel}</span>
                        <Tag color="blue" className="ml-2">{attr.dataType}</Tag>
                        <p className="text-xs text-gray-500 mt-1">{attr.attributeName}</p>
                        {attr.options && attr.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {attr.options.map((opt, idx) => (
                              <Tag key={idx} color="geekblue" className="text-xs">
                                {opt}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveAddedAttribute(index)}
                        size="small"
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Attribute Form */}
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Thêm thuộc tính mới:</p>
              <div className="space-y-2">
                <Input
                  value={newAttribute.attributeName}
                  onChange={(e) => setNewAttribute({ ...newAttribute, attributeName: e.target.value })}
                  placeholder="Tên thuộc tính (ví dụ: driverSize)"
                  size="small"
                />
                <Input
                  value={newAttribute.attributeLabel}
                  onChange={(e) => setNewAttribute({ ...newAttribute, attributeLabel: e.target.value })}
                  placeholder="Nhãn hiển thị (ví dụ: Kích thước driver)"
                  size="small"
                />
                <Select
                  value={newAttribute.dataType}
                  onChange={(value) => setNewAttribute({ 
                    ...newAttribute, 
                    dataType: value,
                    // Keep options if changing to STRING or SELECT, clear for other types
                    options: (value === 'SELECT' || value === 'STRING') ? (newAttribute.options || []) : undefined
                  })}
                  style={{ width: '100%' }}
                  size="small"
                >
                  <Option value="STRING">STRING</Option>
                  <Option value="NUMBER">NUMBER</Option>
                  <Option value="BOOLEAN">BOOLEAN</Option>
                  <Option value="DATE">DATE</Option>
                  <Option value="DECIMAL">DECIMAL</Option>
                  <Option value="SELECT">SELECT</Option>
                </Select>
                {/* Show options management for SELECT or STRING type */}
                {(newAttribute.dataType === 'SELECT' || newAttribute.dataType === 'STRING') && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 font-medium">Tùy chọn:</label>
                    
                    {/* Display existing options with delete buttons */}
                    {newAttribute.options && newAttribute.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                        {newAttribute.options.map((opt, idx) => (
                          <Tag
                            key={idx}
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              const newOptions = newAttribute.options?.filter((_, i) => i !== idx) || [];
                              setNewAttribute({
                                ...newAttribute,
                                options: newOptions.length > 0 ? newOptions : undefined
                              });
                            }}
                            color="blue"
                            className="mb-0"
                          >
                            {opt}
                          </Tag>
                        ))}
                      </div>
                    )}
                    
                    {/* Add new option input */}
                    <div className="flex gap-2">
                      <Input
                        value={newAttributeOptionsInput}
                        onChange={(e) => setNewAttributeOptionsInput(e.target.value)}
                        placeholder="Nhập tùy chọn mới"
                        size="small"
                        onPressEnter={(e) => {
                          e.preventDefault();
                          const value = newAttributeOptionsInput.trim();
                          if (value && !newAttribute.options?.includes(value)) {
                            setNewAttribute({
                              ...newAttribute,
                              options: [...(newAttribute.options || []), value]
                            });
                            setNewAttributeOptionsInput('');
                          }
                        }}
                      />
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => {
                          const value = newAttributeOptionsInput.trim();
                          if (value && !newAttribute.options?.includes(value)) {
                            setNewAttribute({
                              ...newAttribute,
                              options: [...(newAttribute.options || []), value]
                            });
                            setNewAttributeOptionsInput('');
                          }
                        }}
                      >
                        Thêm
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Nhấn Enter hoặc nút "Thêm" để thêm tùy chọn mới. Click vào tag để xóa.
                    </p>
                  </div>
                )}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddAttribute}
                  block
                  size="small"
                >
                  Thêm thuộc tính
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={onClose} size="large">
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              size="large"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriesEditModal;
