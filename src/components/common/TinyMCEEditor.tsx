import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { FileUploadService } from '../../services/FileUploadService';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Nhập mô tả chi tiết sản phẩm...',
  height = 400 
}) => {
  const editorRef = useRef<any>(null);

  // Custom image upload handler
  const handleImageUpload = async (blobInfo: any): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert blob to File
        const file = new File([blobInfo.blob()], blobInfo.filename(), {
          type: blobInfo.blob().type
        });

        console.log('TinyMCE - Uploading image:', file.name);

        // Upload using FileUploadService
        const response = await FileUploadService.uploadFile(file);
        
        if (response && response.url) {
          const imageUrl = response.url;
          console.log('TinyMCE - Image uploaded successfully:', imageUrl);
          resolve(imageUrl);
        } else {
          reject('Upload failed: Invalid response');
        }
      } catch (error) {
        console.error('TinyMCE - Image upload error:', error);
        reject('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    });
  };

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      onInit={(_evt, editor) => {
        editorRef.current = editor;
        
        // Override lệnh Image button để mở file picker trực tiếp
        editor.ui.registry.addButton('customImage', {
          icon: 'image',
          tooltip: 'Chèn ảnh',
          onAction: () => {
            // Tạo input file để chọn ảnh
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/jpeg,image/jpg,image/png,image/gif,image/webp');
            
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

              try {
                console.log('TinyMCE - Uploading image:', file.name);
                
                // Upload file
                const response = await FileUploadService.uploadFile(file);
                
                if (response && response.url) {
                  console.log('TinyMCE - Image uploaded:', response.url);
                  
                  // Insert ảnh vào editor ngay lập tức
                  editor.insertContent(`<img src="${response.url}" alt="${file.name}" />`);
                } else {
                  console.error('Upload failed: Invalid response');
                  alert('Upload ảnh thất bại!');
                }
              } catch (error) {
                console.error('TinyMCE - Upload error:', error);
                alert('Upload ảnh thất bại: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            };
            
            input.click();
          }
        });
      }}
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height: height,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'charmap',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | customImage link | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        placeholder: placeholder,
        
        // Paste images - vẫn giữ để paste ảnh từ clipboard
        images_upload_handler: handleImageUpload,
        paste_data_images: true,
        automatic_uploads: true,
        
        // File types
        images_file_types: 'jpg,jpeg,png,gif,webp',
        
        // Branding
        branding: false,
        promotion: false,
      }}
    />
  );
};

export default TinyMCEEditor;
