interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}

interface HTMLInputElement {
  files: FileList | null;
}
