import React, { useState } from 'react';
import { X, FileText, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { WarrantyService } from '../../services/customer/WarrantyService';
import { FileUploadService } from '../../services/FileUploadService';
import { showCenterSuccess, showCenterError } from '../../utils/notification';
import type { Warranty } from '../../types/api';

interface Props {
  warranty: Warranty;
  onClose: () => void;
  onSuccess?: () => void;
}

const RequestRepairModal: React.FC<Props> = ({ warranty, onClose, onSuccess }) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [covered, setCovered] = useState<boolean | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (uploadingFiles.length + files.length > maxFiles) {
      showCenterError(`Chỉ được tải tối đa ${maxFiles} ảnh`, 'Lỗi');
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const validation = FileUploadService.validateFile(file, maxSize, allowedTypes);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        showCenterError(`${file.name}: ${validation.error}`, 'Lỗi');
      }
    }

    setUploadingFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (uploadingFiles.length === 0) return [];

    setIsUploading(true);
    const urls: string[] = [];

    try {
      for (const file of uploadingFiles) {
        const response = await FileUploadService.uploadImage(file);
        urls.push(response.url);
      }
      return urls;
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể tải ảnh lên', 'Lỗi');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!problemDescription.trim()) {
      showCenterError('Vui lòng mô tả vấn đề', 'Lỗi');
      return;
    }

    if (!warranty.id) {
      showCenterError('Warranty ID không hợp lệ', 'Lỗi');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload files first
      let attachmentUrls: string[] = [];
      if (uploadingFiles.length > 0) {
        attachmentUrls = await uploadFiles();
      }

      // Submit repair request
      await WarrantyService.requestRepair(warranty.id, {
        problemDescription: problemDescription.trim(),
        covered: covered,
        attachmentUrls: attachmentUrls,
      });

      showCenterSuccess(
        `Yêu cầu sửa chữa cho sản phẩm "${warranty.productName}" đã được gửi`,
        'Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất'
      );

      onSuccess?.();
      onClose();
    } catch (error: any) {
      showCenterError(error?.message || 'Không thể gửi yêu cầu sửa chữa', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Yêu cầu sửa chữa</h2>
            <p className="text-sm text-gray-500 mt-1">{warranty.productName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Problem Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Mô tả vấn đề *</span>
            </label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết vấn đề của sản phẩm..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={5}
              disabled={isSubmitting || isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">Mô tả càng chi tiết càng tốt để chúng tôi có thể hỗ trợ bạn tốt hơn</p>
          </div>

          {/* Covered */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Sản phẩm có còn trong thời hạn bảo hành không?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="covered"
                  value="true"
                  checked={covered === true}
                  onChange={() => setCovered(true)}
                  disabled={isSubmitting || isUploading}
                  className="w-4 h-4 text-orange-500"
                />
                <span className="text-sm text-gray-700">Có</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="covered"
                  value="false"
                  checked={covered === false}
                  onChange={() => setCovered(false)}
                  disabled={isSubmitting || isUploading}
                  className="w-4 h-4 text-orange-500"
                />
                <span className="text-sm text-gray-700">Không</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="covered"
                  value="null"
                  checked={covered === null}
                  onChange={() => setCovered(null)}
                  disabled={isSubmitting || isUploading}
                  className="w-4 h-4 text-orange-500"
                />
                <span className="text-sm text-gray-700">Không chắc</span>
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-orange-500" />
              <span>Hình ảnh đính kèm (tối đa 5 ảnh)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                disabled={isSubmitting || isUploading || uploadingFiles.length >= 5}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  isSubmitting || isUploading || uploadingFiles.length >= 5
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploadingFiles.length >= 5 ? 'Đã đạt tối đa 5 ảnh' : 'Click để chọn ảnh hoặc kéo thả vào đây'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 10MB/ảnh)
                </span>
              </label>
            </div>

            {/* File Preview */}
            {uploadingFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting || isUploading}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || !problemDescription.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isUploading ? 'Đang tải ảnh...' : 'Đang gửi...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Gửi yêu cầu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestRepairModal;

