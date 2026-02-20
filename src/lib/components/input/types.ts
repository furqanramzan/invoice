import type { Snippet } from 'svelte';
import type { Options } from '$lib/utils';

export type BaseInputProps = {
  children?: Snippet;
  field: string;
  label?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  placeholder?: string;
  errors?: string[];
};

type NumberString = string | number;

export type SelectFieldType = NumberString;

export type SelectInputProps = BaseInputProps & {
  options: Options;
  allowClear?: boolean;
  default?: SelectFieldType;
  onchange?: (value?: SelectFieldType) => void;
  value?: SelectFieldType;
};

export type DateInputProps = BaseInputProps & {
  value?: string;
};

export type NumberFieldType = number;

export type NumberInputProps = BaseInputProps & {
  value?: NumberFieldType;
  default?: NumberFieldType;
  min?: number | string;
  max?: number | string;
  onchange?: (value?: NumberFieldType) => void;
  onblur?: (value?: NumberFieldType) => void;
};

export type TextFieldType = NumberString;
export type TextInputProps = BaseInputProps & {
  value?: string | number;
};

export type PasswordInputProps = BaseInputProps & {
  value?: string;
  password?: 'current' | 'new';
};

export type RadioFieldType = NumberString;
export type RadioInputProps = BaseInputProps & {
  options: Options;
  onchange?: (value?: RadioFieldType) => void;
  value?: RadioFieldType;
};

export type FileInputProps = BaseInputProps & {
  accept?: string;
  value?: FileList;
  urlValue?: string | null;
};

export type TextAreaInputProps = BaseInputProps & {
  value?: string | number;
};

export interface FileUrl {
  url: string;
  name: string;
  deleted?: boolean;
}
export type FileUrls = Array<FileUrl>;
export type MultiFileInputProps = BaseInputProps & {
  value?: FileList;
  urls?: FileUrls;
};
