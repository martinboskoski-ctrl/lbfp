import { useState, useRef } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';
import { useInitiateUpload, useConfirmUpload } from '../../hooks/useProjects.js';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const FileUploader = ({ projectId, gateNumber }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const initiate = useInitiateUpload();
  const confirm = useConfirmUpload();

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadedFile(null);

    try {
      const { data } = await initiate.mutateAsync({
        projectId,
        gateNumber,
        originalName: file.name,
        contentType: file.type || 'application/octet-stream',
      });

      const { file: fileRecord, uploadUrl } = data;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!uploadRes.ok) throw new Error('S3 upload failed');

      await confirm.mutateAsync({ id: fileRecord._id, size: file.size });

      setUploadedFile(file.name);
      toast.success(`${fileRecord.versionLabel} прикачена`);
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
    } catch (err) {
      toast.error('Прикачувањето не успеа. Проверете ја S3 конфигурацијата.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Прикачи датотека</h2>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-500">Прикачување…</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-2 text-green-600">
            <CheckCircle2 size={28} />
            <p className="text-sm font-medium">Прикачено: {uploadedFile}</p>
            <p className="text-xs text-gray-400">Кликнете за да прикачите уште</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={28} className="text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">
              Повлечете датотека овде или кликнете за да изберете
            </p>
            <p className="text-xs text-gray-400">Поддржани се сите типови датотеки</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
