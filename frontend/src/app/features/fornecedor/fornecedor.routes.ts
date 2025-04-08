import { Routes } from '@angular/router';
import { FornecedorListComponent } from './fornecedor-list/fornecedor-list.component';
import { FornecedorFormComponent } from './fornecedor-form/fornecedor-form.component';

export const FORNECEDOR_ROUTES: Routes = [
    {
        path: '',
        component: FornecedorListComponent
    },
    {
        path: 'new',
        component: FornecedorFormComponent
    },
    {
        path: 'edit/:id',
        component: FornecedorFormComponent
    }
];
