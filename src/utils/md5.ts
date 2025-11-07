import SparkMD5 from 'spark-md5';

/**
 * 计算文件的MD5值
 * @param file 文件对象
 * @returns Promise<string> MD5字符串
 */
export function calculateFileMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const blobSlice = File.prototype.slice;
    const chunkSize = 2097152; // 2MB per chunk for MD5 calculation
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = blobSlice.call(file, start, end);
      fileReader.readAsArrayBuffer(chunk);
    }

    fileReader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer);
        currentChunk += 1;

        if (currentChunk < chunks) {
          loadNext();
        } else {
          const md5 = spark.end();
          resolve(md5);
        }
      }
    };

    fileReader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    loadNext();
  });
}

/**
 * 计算Blob（分片）的MD5值
 * @param blob Blob对象（文件分片）
 * @returns Promise<string> MD5字符串
 */
export function calculateBlobMD5(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (e.target?.result) {
        const spark = new SparkMD5.ArrayBuffer();
        spark.append(e.target.result as ArrayBuffer);
        const md5 = spark.end();
        resolve(md5);
      }
    };

    fileReader.onerror = () => {
      reject(new Error('分片读取失败'));
    };

    fileReader.readAsArrayBuffer(blob);
  });
}
