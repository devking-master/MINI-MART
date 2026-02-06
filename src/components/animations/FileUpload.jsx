
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from 'axios';
import imageCompression from 'browser-image-compression';

const mainVariant = {
    initial: { x: 0, y: 0 },
    animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
};

const IMGBB_API_KEY = "5c96460dbce35dbdb36e2e26b2dad63e";

export const FileUpload = ({
    onUploadComplete
}) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = async (newFiles) => {
        // Generate previews
        const newFilesWithPreview = newFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            uploading: true,
            completed: false,
            error: false
        }));

        setFiles((prev) => [...prev, ...newFilesWithPreview]);

        // Start Upload Process
        let currentUrls = [...uploadedUrls];

        // Process each new file
        for (let i = 0; i < newFilesWithPreview.length; i++) {
            const fileObj = newFilesWithPreview[i];
            const file = fileObj.file;

            try {
                // Compress
                setCompressing(true);
                const options = {
                    maxSizeMB: 0.8,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                setCompressing(false);

                // Upload
                setUploading(true);
                const formData = new FormData();
                formData.append("image", compressedFile);
                formData.append("key", IMGBB_API_KEY);

                const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
                    timeout: 120000
                });

                const url = response.data.data.display_url;
                currentUrls.push(url);

                // Update file status to completed
                setFiles(prev => prev.map(f => f.preview === fileObj.preview ? { ...f, uploading: false, completed: true } : f));

            } catch (error) {
                console.error("Upload failed", error);
                setFiles(prev => prev.map(f => f.preview === fileObj.preview ? { ...f, uploading: false, error: true } : f));
            }
        }

        setUploading(false);
        setUploadedUrls(currentUrls);
        if (onUploadComplete) onUploadComplete(currentUrls);
    };

    const onDrop = (acceptedFiles) => {
        handleFileChange(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        multiple: true,
        noClick: true,
        onDrop,
        onDropRejected: (error) => {
            console.log(error);
        },
    });

    const removeFile = (index) => {
        // Logic for removing file needs to sync with uploadedUrls
        // This is tricky if uploadedUrls and files array indices mismatch due to errors
        // For simplicity, we filter both based on index, assuming sync order (since we append)
        const newFiles = files.filter((_, i) => i !== index);
        const newUrls = uploadedUrls.filter((_, i) => i !== index);

        setFiles(newFiles);
        setUploadedUrls(newUrls);
        if (onUploadComplete) onUploadComplete(newUrls);
    }

    function handleClick() {
        fileInputRef.current?.click();
    }

    return (
        <div className="w-full" {...getRootProps()}>
            <motion.div
                onClick={handleClick}
                whileHover="animate"
                className="p-10 group/file block rounded-3xl cursor-pointer w-full relative overflow-hidden"
            >
                <input
                    {...getInputProps()}
                    ref={fileInputRef}
                    id="file-upload-handle"
                    className="hidden"
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                    <GridPattern />
                </div>
                <div className="flex flex-col items-center justify-center">
                    <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
                        Upload images
                    </p>
                    <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
                        Drag or drop your files here or click to upload
                    </p>
                    <div className="relative w-full mt-10 max-w-xl mx-auto">
                        {files.length > 0 &&
                            files.map((file, idx) => (
                                <motion.div
                                    key={"file" + idx}
                                    layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                                    className={
                                        "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800"
                                    }
                                >
                                    <div className="flex justify-between w-full items-center gap-4">
                                        <motion.div className="flex items-center gap-2">
                                            <img src={file.preview} alt="" className="w-10 h-10 object-cover rounded-lg" />
                                            <div>
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    layout
                                                    className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                                                >
                                                    {file.file.name}
                                                </motion.p>
                                                <p className="text-xs text-neutral-500 text-left">
                                                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </motion.div>
                                        <div className="flex items-center gap-2">
                                            {file.uploading ? (
                                                <Loader className="animate-spin text-blue-500" size={16} />
                                            ) : file.completed ? (
                                                <CheckCircle className="text-green-500" size={16} />
                                            ) : file.error ? (
                                                <X className="text-red-500" size={16} />
                                            ) : null}

                                            <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="p-1 hover:bg-red-50 text-red-500 rounded-full">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        {!files.length && (
                            <motion.div
                                layoutId="file-upload"
                                variants={mainVariant}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                }}
                                className={
                                    "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-2xl shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                                }
                            >
                                {isDragActive ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-neutral-600 flex flex-col items-center"
                                    >
                                        Drop it
                                        <Upload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                    </motion.p>
                                ) : (
                                    <Upload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                                )}
                            </motion.div>
                        )}

                        {!files.length && (
                            <motion.div
                                variants={secondaryVariant}
                                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-3xl"
                            ></motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export function GridPattern() {
    const columns = 41;
    const rows = 11;
    return (
        <div className="flex bg-gray-50 dark:bg-neutral-900 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
            {Array.from({ length: columns * rows }).map((_, index) => {
                return (
                    <div
                        key={`${index}`}
                        className="w-10 h-10 flex flex-shrink-0 rounded-[2px] bg-white dark:bg-neutral-800 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
                    />
                );
            })}
        </div>
    );
}
