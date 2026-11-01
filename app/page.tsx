
"use client";

import { useEffect, useState } from "react"; import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageList, setImageList] = useState<string[]>([]);

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    const fileExtension =
      selectedFile.type === "image/png"
        ? "png"
        : selectedFile.type === "image/webp"
          ? "webp"
          : "jpg";

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, selectedFile);

    if (error) {
      setMessage("アップロードに失敗しました：" + error.message);
      return;
    }

    const { data } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    await fetchImages();

    setMessage("アップロードに成功しました！");
  }

  async function fetchImages() {
    const { data, error } = await supabase.storage
      .from("images")
      .list();

    if (error) {
      setMessage("画像一覧の取得に失敗しました：" + error.message);
      return;
    }

    const urls = data.map((file) => {
      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(file.name);

      return data.publicUrl;
    });

    setImageList(urls);
  }

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800">
          画像アップロードアプリ
        </h1>

        <p className="mt-2 text-gray-600">
          画像をアップロードして保存できます。
        </p>

        <div
          className={`mt-8 rounded-xl border-2 border-dashed p-12 text-center ${isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-400 bg-white"
            }`}

          onDragLeave={() => {
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];

            if (file) {
              if (file.size >= 5 * 1024 * 1024) {
                setSelectedFile(null);
                setMessage("エラー：画像は5MB未満にしてください。");
                return;
              }

              const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

              if (!allowedTypes.includes(file.type)) {
                setSelectedFile(null);
                setMessage("エラー：JPG・PNG・WebP形式の画像を選択してください。");
                return;
              }

              setSelectedFile(file);
              setMessage("選択した画像：" + file.name);
            }
          }}
        >
          <p className="text-gray-600">
            ここに画像をドラッグ＆ドロップ
          </p>

          <p className="mt-2 text-sm text-gray-400">
            JPG / PNG / WebP（5MB未満）
          </p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                if (file.size >= 5 * 1024 * 1024) {
                  setSelectedFile(null);
                  setMessage("エラー：画像は5MB未満にしてください。");
                  return;
                }

                const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

                if (!allowedTypes.includes(file.type)) {
                  setSelectedFile(null);
                  setMessage("エラー：JPG・PNG・WebP形式の画像を選択してください。");
                  return;
                }

                setSelectedFile(file);
                setMessage("選択した画像：" + file.name);
              }
            }}
            className="mt-6"
          />
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-white disabled:bg-gray-400"
        >
          画像をアップロード
        </button>

        <p className="mt-6 text-gray-600">
          {message}
        </p>

        <h2 className="mt-10 text-xl font-bold text-gray-800">
          アップロード済み画像
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {imageList.map((url) => (
            <Image
              key={url}
              src={url}
              alt="アップロード済み画像"
              width={300}
              height={200}
              style={{ width: "100%", height: "auto" }}
              className="rounded-lg"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
