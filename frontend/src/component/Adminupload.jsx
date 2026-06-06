import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';

function AdminUpload() {

  const { problemId } = useParams();

  // console.log("Problem ID:", problemId);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors
  } = useForm();

  const selectedFile = watch('videoFile')?.[0];

  // ================= UPLOAD FUNCTION =================

  const onSubmit = async (data) => {

    const file = data.videoFile[0];

    setUploading(true);
    setUploadProgress(0);
    clearErrors();

    try {

      // ===== STEP 1: GET SIGNATURE =====

      const signatureResponse = await axiosClient.get(
        `/video/create/${problemId}`
      );

      console.log("Signature Response:");
      console.log(signatureResponse.data);

      const {
        signature,
        timestamp,
        public_id,
        api_key,
        upload_url
      } = signatureResponse.data;

      // ===== STEP 2: CREATE FORM DATA =====

      const formData = new FormData();

      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append("type", "authenticated");
      formData.append('api_key', api_key);
      // ===== STEP 3: UPLOAD TO CLOUDINARY =====

      const uploadResponse = await axios.post(
        upload_url,
        formData,
        {
          onUploadProgress: (progressEvent) => {

            const progress = Math.round(
              (progressEvent.loaded * 100) /
              progressEvent.total
            );

            setUploadProgress(progress);
          }
        }
      );

      const cloudinaryResult = uploadResponse.data;

      console.log("Cloudinary Upload Success:");
      console.log(cloudinaryResult);

      // ===== STEP 4: SAVE METADATA =====

      const metadataResponse = await axiosClient.post(
        '/video/save',
        {
          problemId,
          cloudinaryPublicId: cloudinaryResult.public_id,
          secureUrl: cloudinaryResult.secure_url,
          duration: cloudinaryResult.duration,
        }
      );

      console.log("Metadata Saved:");
      console.log(metadataResponse.data);

      setUploadedVideo(
        metadataResponse.data.videoSolution
      );

      reset();

    } catch (err) {

      console.log("UPLOAD ERROR:");
      console.log(err.response?.data);

      setError('root', {
        type: 'manual',
        message:
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Upload failed. Please try again.'
      });

    } finally {

      setUploading(false);
      setUploadProgress(0);

    }
  };

  // ================= FORMAT FILE SIZE =================

  const formatFileSize = (bytes) => {

    if (bytes === 0) return '0 Bytes';

    const k = 1024;

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(
      Math.log(bytes) / Math.log(k)
    );

    return (
      parseFloat(
        (bytes / Math.pow(k, i)).toFixed(2)
      ) +
      ' ' +
      sizes[i]
    );
  };

  // ================= FORMAT DURATION =================

  const formatDuration = (seconds) => {

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // ================= UI =================

  return (
    <div className="max-w-md mx-auto p-6">

      <div className="card bg-base-100 shadow-xl">

        <div className="card-body">

          <h2 className="card-title">
            Upload Video
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >

            {/* FILE INPUT */}

            <div className="form-control w-full">

              <label className="label">
                <span className="label-text">
                  Choose video file
                </span>
              </label>

              <input
                type="file"
                accept="video/*"
                disabled={uploading}
                className={`file-input file-input-bordered w-full ${
                  errors.videoFile
                    ? 'file-input-error'
                    : ''
                }`}
                {...register('videoFile', {
                  required:
                    'Please select a video file',

                  validate: {

                    isVideo: (files) => {

                      if (
                        !files ||
                        !files[0]
                      ) {
                        return 'Please select a video file';
                      }

                      const file = files[0];

                      return (
                        file.type.startsWith(
                          'video/'
                        ) ||
                        'Please select a valid video file'
                      );
                    },

                    fileSize: (files) => {

                      if (
                        !files ||
                        !files[0]
                      ) {
                        return true;
                      }

                      const file = files[0];

                      const maxSize =
                        100 * 1024 * 1024;

                      return (
                        file.size <= maxSize ||
                        'File size must be less than 100MB'
                      );
                    }
                  }
                })}
              />

              {errors.videoFile && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.videoFile.message}
                  </span>
                </label>
              )}
            </div>

            {/* SELECTED FILE */}

            {selectedFile && (

              <div className="alert alert-info">

                <div>

                  <h3 className="font-bold">
                    Selected File
                  </h3>

                  <p className="text-sm">
                    {selectedFile.name}
                  </p>

                  <p className="text-sm">
                    Size:
                    {' '}
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </p>

                </div>

              </div>
            )}

            {/* PROGRESS */}

            {uploading && (

              <div className="space-y-2">

                <div className="flex justify-between text-sm">

                  <span>Uploading...</span>

                  <span>
                    {uploadProgress}%
                  </span>

                </div>

                <progress
                  max="100"
                  value={uploadProgress}
                  className="progress progress-primary w-full"
                />

              </div>
            )}

            {/* ERROR */}

            {errors.root && (

              <div className="alert alert-error">

                <span>
                  {errors.root.message}
                </span>

              </div>
            )}

            {/* SUCCESS */}

            {uploadedVideo && (

              <div className="alert alert-success">

                <div>

                  <h3 className="font-bold">
                    Upload Successful
                  </h3>

                  <p className="text-sm">
                    Duration:
                    {' '}
                    {formatDuration(
                      uploadedVideo.duration
                    )}
                  </p>

                  <p className="text-sm">
                    Uploaded:
                    {' '}
                    {new Date(
                      uploadedVideo.uploadedAt
                    ).toLocaleString()}
                  </p>

                </div>

              </div>
            )}

            {/* BUTTON */}

            <div className="card-actions justify-end">

              <button
                type="submit"
                disabled={uploading}
                className={`btn btn-primary ${
                  uploading ? 'loading' : ''
                }`}
              >
                {uploading
                  ? 'Uploading...'
                  : 'Upload Video'}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default AdminUpload;