const FormDataModule = require('react-native/Libraries/Network/FormData');
const BlobModule = require('react-native/Libraries/Blob/Blob');
const FileModule = require('react-native/Libraries/Blob/File');
const FileReaderModule = require('react-native/Libraries/Blob/FileReader');
const URLModule = require('react-native/Libraries/Blob/URL');

const FormDataPolyfill = FormDataModule.default || FormDataModule;
const BlobPolyfill = BlobModule.default || BlobModule;
const FilePolyfill = FileModule.default || FileModule;
const FileReaderPolyfill = FileReaderModule.default || FileReaderModule;
const URLPolyfill = URLModule.URL || URLModule.default || URLModule;
const URLSearchParamsPolyfill = URLModule.URLSearchParams;

if (typeof globalThis.FormData === 'undefined' && FormDataPolyfill) {
  globalThis.FormData = FormDataPolyfill;
}

if (typeof globalThis.Blob === 'undefined' && BlobPolyfill) {
  globalThis.Blob = BlobPolyfill;
}

if (typeof globalThis.File === 'undefined' && FilePolyfill) {
  globalThis.File = FilePolyfill;
}

if (typeof globalThis.FileReader === 'undefined' && FileReaderPolyfill) {
  globalThis.FileReader = FileReaderPolyfill;
}

if (typeof globalThis.URL === 'undefined' && URLPolyfill) {
  globalThis.URL = URLPolyfill;
}

if (typeof globalThis.URLSearchParams === 'undefined' && URLSearchParamsPolyfill) {
  globalThis.URLSearchParams = URLSearchParamsPolyfill;
}
