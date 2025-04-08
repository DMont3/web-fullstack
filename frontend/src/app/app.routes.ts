import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/empresas', pathMatch: 'full' },
    {
        path: 'empresas',
        loadChildren: () => import('./features/empresa/empresa.routes')
                                                    .then(m => m.EMPRESA_ROUTES)
    },
    {
        path: 'fornecedores',
        loadChildren: () => import('./features/fornecedor/fornecedor.routes')
                                                    .then(m => m.FORNECEDOR_ROUTES)
    }
];
