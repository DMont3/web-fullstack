import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Empresa } from '../../../models/empresa.model';
import { EmpresaService } from '../empresa.service';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './empresa-list.component.html',
  styleUrls: ['./empresa-list.component.scss']
})
export class EmpresaListComponent implements OnInit {
  empresas: Empresa[] = [];
  displayedColumns: string[] = ['cnpj', 'nomeFantasia', 'cep', 'actions'];
  isLoading = false;

  constructor(
    private empresaService: EmpresaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.isLoading = true;
    this.empresaService.getEmpresas().subscribe({
      next: (data) => {
        this.empresas = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar empresas.', 'Erro', { duration: 3000 });
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  deleteEmpresa(id: number | undefined): void {
    if (!id) return;
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      this.isLoading = true;
      this.empresaService.deleteEmpresa(id).subscribe({
        next: () => {
          this.snackBar.open('Empresa excluída com sucesso!', 'Ok', { duration: 3000 });
          this.loadEmpresas();
          this.isLoading = false;
        },
        error: (err) => {
          this.snackBar.open('Erro ao excluir empresa.', 'Erro', { duration: 3000 });
          console.error(err);
          this.isLoading = false;
        }
      });
    }
  }
}
