import type { Id, ListParams } from './common';

export interface PassEntry {
  id: Id;
  title: string;
  login: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePassEntryDto {
  title: string;
  login: string;
  password: string;
}

export interface UpdatePassEntryDto {
  title?: string;
  login?: string;
  password?: string;
}

export interface PassListParams extends ListParams {}
