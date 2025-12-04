import React, { useState, useMemo, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Tooltip,
  Empty,
  Typography,
  message,
  Image,
  Upload
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
  SearchOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { usePolicyCategories } from '../../../hooks/usePolicyCategories';
import { usePolicyItems } from '../../../hooks/usePolicyItems';
import { TinyMCEEditor } from '../../../components/common';
import { FileUploadService } from '../../../services/FileUploadService';
import type {
  PolicyCategory,
  PolicyItem,
  CreatePolicyCategoryRequest,
  CreatePolicyItemRequest,
} from '../../../types/policy';

const { TextArea } = Input;
const { Title, Text } = Typography;

type ViewMode = 'categories' | 'items';

const PolicyManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PolicyCategory | null>(null);
  const [editingItem, setEditingItem] = useState<PolicyItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PolicyItem | null>(null);
  const [searchText, setSearchText] = useState('');
  const [iconUploading, setIconUploading] = useState(false);
  
  const [categoryForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  
  const [categoryPagination, setCategoryPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} danh mục`,
  });

  const [itemPagination, setItemPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
  });

  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: refetchCategories,
  } = usePolicyCategories();

  const {
    items,
    loading: itemsLoading,
    createItem,
    updateItem,
    deleteItem,
    refetch: refetchItems,
  } = usePolicyItems(selectedCategory?.id);

  // Stats
  const stats = useMemo(() => ({
    totalCategories: categories.length,
    activeCategories: categories.filter(c => c.isActive).length,
    inactiveCategories: categories.filter(c => c.isActive === false).length,
    totalItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0),
  }), [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    let filtered = categories;
    
    if (searchText) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchText.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return filtered;
  }, [categories, searchText]);

  // Category handlers
  const handleCreateCategory = useCallback(() => {
    setEditingCategory(null);
    categoryForm.resetFields();
    setCategoryModalVisible(true);
  }, [categoryForm]);

  const handleEditCategory = useCallback((category: PolicyCategory) => {
    setEditingCategory(category);
    categoryForm.setFieldsValue(category);
    setCategoryModalVisible(true);
  }, [categoryForm]);

  const handleIconUpload = useCallback(async (file: File) => {
    setIconUploading(true);
    try {
      const response = await FileUploadService.uploadFile(file);
      if (response && response.url) {
        categoryForm.setFieldsValue({ iconUrl: response.url });
        message.success('Ảnh icon đã được tải lên thành công!');
        return response.url;
      }
    } catch (error) {
      message.error('Tải ảnh thất bại. Vui lòng thử lại.');
      console.error('Icon upload error:', error);
    } finally {
      setIconUploading(false);
    }
    return '';
  }, [categoryForm]);

  const handleDeleteCategory = useCallback(async (categoryId: string, categoryName: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          await deleteCategory(categoryId);
          message.success('Xóa danh mục thành công!');
          // Force refresh to ensure UI updates
          await refetchCategories();
        } catch (error) {
          message.error('Không thể xóa danh mục. Vui lòng thử lại.');
          console.error('Delete category error:', error);
        }
      },
    });
  }, [deleteCategory, refetchCategories]);

  const handleCategorySubmit = useCallback(async (values: any) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        message.success('Cập nhật danh mục thành công!');
      } else {
        await createCategory(values as CreatePolicyCategoryRequest);
        message.success('Tạo danh mục thành công!');
      }
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      // Force refresh to ensure UI updates
      await refetchCategories();
    } catch (error) {
      message.error(editingCategory ? 'Không thể cập nhật danh mục' : 'Không thể tạo danh mục');
    }
  }, [editingCategory, createCategory, updateCategory, categoryForm, refetchCategories]);

  // Item handlers
  const handleViewItems = useCallback((category: PolicyCategory) => {
    setSelectedCategory(category);
    setViewMode('items');
  }, []);

  const handleBackToCategories = useCallback(() => {
    setViewMode('categories');
    setSelectedCategory(null);
  }, []);

  const handleCreateItem = useCallback(() => {
    setEditingItem(null);
    itemForm.resetFields();
    if (selectedCategory) {
      itemForm.setFieldsValue({ policyCategoryId: selectedCategory.id });
    }
    setItemModalVisible(true);
  }, [itemForm, selectedCategory]);

  const handleEditItem = useCallback((item: PolicyItem) => {
    setEditingItem(item);
    itemForm.setFieldsValue(item);
    setItemModalVisible(true);
  }, [itemForm]);

  const handleViewItemDetail = useCallback((item: PolicyItem) => {
    setViewingItem(item);
    setDetailModalVisible(true);
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string, itemTitle: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa mục "${itemTitle}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          await deleteItem(itemId);
          message.success('Xóa mục thành công!');
          // Force refresh to ensure UI updates
          if (selectedCategory?.id) {
            await refetchItems(selectedCategory.id);
          }
          // Also refresh categories to update item count
          await refetchCategories();
        } catch (error) {
          message.error('Không thể xóa mục. Vui lòng thử lại.');
          console.error('Delete item error:', error);
        }
      },
    });
  }, [deleteItem, selectedCategory, refetchItems, refetchCategories]);

  const handleItemSubmit = useCallback(async (values: any) => {
    try {
      const itemData = {
        ...values,
        policyCategoryId: values.policyCategoryId || selectedCategory?.id,
      };

      if (editingItem) {
        await updateItem(editingItem.id, itemData);
        message.success('Cập nhật mục thành công!');
      } else {
        await createItem(itemData as CreatePolicyItemRequest);
        message.success('Tạo mục thành công!');
      }
      setItemModalVisible(false);
      itemForm.resetFields();
      // Force refresh to ensure UI updates
      if (selectedCategory?.id) {
        await refetchItems(selectedCategory.id);
      }
      // Also refresh categories to update item count
      await refetchCategories();
    } catch (error) {
      message.error(editingItem ? 'Không thể cập nhật mục' : 'Không thể tạo mục');
    }
  }, [editingItem, selectedCategory, createItem, updateItem, itemForm, refetchItems, refetchCategories]);

  // Category columns
  const categoryColumns: ColumnsType<PolicyCategory> = useMemo(() => [
    {
      title: 'Danh mục',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string, record: PolicyCategory) => (
        <Space>
          {record.iconUrl ? (
            <Image
              src={record.iconUrl}
              alt={name}
              width={40}
              height={40}
              style={{ borderRadius: 4, objectFit: 'cover' }}
              fallback="data:image/png;base64,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"
            />
          ) : (
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 4, 
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PictureOutlined style={{ fontSize: 20, color: '#bfbfbf' }} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Thứ tự: {record.displayOrder}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-',
    },
    {
      title: 'Số mục',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      align: 'center',
      render: (itemCount: number) => (
        <Tag color="blue">{itemCount}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Tạm dừng', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record: PolicyCategory) => (
        <Space size="small">
          <Tooltip title="Xem mục con">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewItems(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditCategory(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCategory(record.id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [handleViewItems, handleEditCategory, handleDeleteCategory]);

  // Item columns
  const itemColumns: ColumnsType<PolicyItem> = useMemo(() => [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (title: string, record: PolicyItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Thứ tự: {record.displayOrder}
          </Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Tạm dừng', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (updatedAt: string) => new Date(updatedAt).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: PolicyItem) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewItemDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditItem(record)}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteItem(record.id, record.title)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [handleEditItem, handleDeleteItem, handleViewItemDetail]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {viewMode === 'items' && (
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToCategories}
              style={{ paddingLeft: 0, marginBottom: 8 }}
            >
              Quay lại danh mục
            </Button>
          )}
          <Title level={3} style={{ margin: 0 }}>
            {viewMode === 'categories' ? 'Quản lý Chính Sách' : `Mục con: ${selectedCategory?.name}`}
          </Title>
          <Text type="secondary">
            {viewMode === 'categories' 
              ? 'Quản lý danh mục chính sách hệ thống'
              : `Quản lý các mục trong danh mục "${selectedCategory?.name}"`
            }
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={viewMode === 'categories' ? handleCreateCategory : handleCreateItem}
        >
          {viewMode === 'categories' ? 'Tạo danh mục' : 'Tạo mục mới'}
        </Button>
      </div>

      {viewMode === 'categories' ? (
        <>
          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Tổng danh mục" 
                  value={stats.totalCategories}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Đang hoạt động" 
                  value={stats.activeCategories}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Tạm dừng" 
                  value={stats.inactiveCategories}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Tổng mục" 
                  value={stats.totalItems}
                  prefix={<PictureOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Search */}
          <Input
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            size="large"
            style={{ width: '100%', marginBottom: 16 }}
          />

          {/* Categories Table */}
          <Card>
            <Table
                columns={categoryColumns}
                dataSource={filteredCategories}
                loading={categoriesLoading}
                rowKey="id"
                pagination={categoryPagination}
                onChange={setCategoryPagination}
                scroll={{ x: 1200 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có danh mục nào"
                    />
                  ),
                }}
              />
          </Card>
        </>
      ) : (
        <>
          {/* Items Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic 
                  title="Tổng mục" 
                  value={items.length}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic 
                  title="Đang hoạt động" 
                  value={items.filter(i => i.isActive).length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic 
                  title="Tạm dừng" 
                  value={items.filter(i => !i.isActive).length}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Items Table */}
          <Card>
            <Table
              columns={itemColumns}
              dataSource={items}
              loading={itemsLoading}
              rowKey="id"
              pagination={itemPagination}
              onChange={setItemPagination}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có mục nào trong danh mục này"
                  />
                ),
              }}
            />
          </Card>
        </>
      )}

      {/* Category Modal */}
      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          categoryForm.resetFields();
        }}
        onOk={() => categoryForm.submit()}
        width={600}
        okText={editingCategory ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCategorySubmit}
          initialValues={{
            displayOrder: 1,
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Ví dụ: Chính sách bảo mật" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Mô tả chi tiết về danh mục..." />
          </Form.Item>

          <Form.Item
            name="iconUrl"
            label="Icon danh mục"
            rules={[{ required: true, message: 'Vui lòng tải lên icon!' }]}
            extra="Chọn ảnh icon cho danh mục (khuyến nghị: 40x40px, định dạng PNG/JPG)"
          >
            <div>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={async (file) => {
                  await handleIconUpload(file);
                  return false;
                }}
                disabled={iconUploading}
              >
                <Button icon={<UploadOutlined />} loading={iconUploading}>
                  {iconUploading ? 'Đang tải lên...' : 'Chọn ảnh icon'}
                </Button>
              </Upload>
              {categoryForm.getFieldValue('iconUrl') && (
                <div style={{ marginTop: 12 }}>
                  <Image
                    src={categoryForm.getFieldValue('iconUrl')}
                    alt="Icon preview"
                    width={80}
                    height={80}
                    style={{ borderRadius: 4, objectFit: 'cover', border: '1px solid #d9d9d9' }}
                  />
                  <Button 
                    type="link" 
                    danger 
                    size="small"
                    onClick={() => categoryForm.setFieldsValue({ iconUrl: '' })}
                    style={{ display: 'block', marginTop: 8 }}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Thứ tự hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập thứ tự!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Item Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa mục' : 'Tạo mục mới'}
        open={itemModalVisible}
        onCancel={() => {
          setItemModalVisible(false);
          itemForm.resetFields();
        }}
        onOk={() => itemForm.submit()}
        width={1000}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={itemForm}
          layout="vertical"
          onFinish={handleItemSubmit}
          initialValues={{
            policyCategoryId: selectedCategory?.id,
            displayOrder: 1,
            isActive: true,
          }}
        >
          <Form.Item
            label="Danh mục"
          >
            <Input disabled value={selectedCategory?.name} />
          </Form.Item>

          <Form.Item
            name="policyCategoryId"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Ví dụ: Hướng dẫn sử dụng" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
          >
            <TinyMCEEditor
              value={itemForm.getFieldValue('content') || ''}
              onChange={(content) => itemForm.setFieldsValue({ content })}
              placeholder="Nhập nội dung chi tiết với định dạng phong phú..."
              height={500}
            />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Thứ tự hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập thứ tự!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết mục chính sách"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setViewingItem(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => {
              if (viewingItem) {
                setDetailModalVisible(false);
                handleEditItem(viewingItem);
              }
            }}
          >
            Chỉnh sửa
          </Button>,
        ]}
      >
        {viewingItem && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Danh mục cha:</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{selectedCategory?.name}</Tag>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Tiêu đề:</Text>
              <div style={{ marginTop: 8, fontSize: 16 }}>
                {viewingItem.title}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Nội dung:</Text>
              <div 
                style={{ 
                  marginTop: 8, 
                  padding: 16, 
                  border: '1px solid #d9d9d9', 
                  borderRadius: 4,
                  backgroundColor: '#fafafa'
                }}
                dangerouslySetInnerHTML={{ __html: viewingItem.content }}
              />
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>Thứ tự hiển thị:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="cyan">{viewingItem.displayOrder}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Trạng thái:</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag 
                    color={viewingItem.isActive ? 'success' : 'default'} 
                    icon={viewingItem.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  >
                    {viewingItem.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Ngày tạo:</Text>
                <div style={{ marginTop: 8 }}>
                  {new Date(viewingItem.createdAt).toLocaleString('vi-VN')}
                </div>
              </Col>
            </Row>

            <div>
              <Text strong>Ngày cập nhật:</Text>
              <div style={{ marginTop: 8 }}>
                {new Date(viewingItem.updatedAt).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default PolicyManagement;
