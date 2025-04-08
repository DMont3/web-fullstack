import { Routes } from '@angular/router';
import { EmpresaListComponent } from './empresa-list/empresa-list.component';
import { EmpresaFormComponent } from './empresa-form/empresa-form.component';

export const EMPRESA_ROUTES: Routes = [
  { path: '', component: EmpresaListComponent },
  { path: 'new', component: EmpresaFormComponent },
  { path: 'edit/:id', component: EmpresaFormComponent }
];