import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { switchMap, catchError, tap, debounceTime, filter, first } from 'rxjs/operators';
import { of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { EmpresaService } from '../empresa.service';
import { CepService } from '../../../core/cep.service';
import { FornecedorService } from '../../../features/fornecedor/fornecedor.service';
import { Fornecedor } from '../../../models/fornecedor.model';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './empresa-form.component.html',
  styleUrls: ['./empresa-form.component.scss']
})
export class EmpresaFormComponent implements OnInit {
  empresaForm: FormGroup;
  isEditMode = false;
  empresaId: number | null = null;
  isLoading = false;
  isCepLoading = false;
  allFornecedores: Fornecedor[] = [];

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private fornecedorService: FornecedorService,
    private cepService: CepService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.empresaForm = this.fb.group({
      cnpj: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      nomeFantasia: ['', [Validators.required, Validators.maxLength(255)]],
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      fornecedorIds: [[]]
    });
  }

  ngOnInit(): void {
    this.loadFornecedores();
    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.isEditMode = true;
          this.empresaId = +idParam;
          return this.empresaService.getEmpresa(this.empresaId);
        } else {
          this.isEditMode = false;
          this.empresaId = null;
          return of(null);
        }
      }),
      first()
    ).subscribe({
      next: (empresa) => {
        if (empresa) {
          this.empresaForm.patchValue(empresa);
          this.empresaForm.get('fornecedorIds')?.setValue(empresa.fornecedorIds || []);
        }
        this.setupCepLookup();
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar dados da empresa.', 'Erro', { duration: 3000 });
        console.error(err);
        this.router.navigate(['/empresas']);
      }
    });
  }

  loadFornecedores(): void {
    this.isLoading = true;
    this.fornecedorService.getAllFornecedoresSimple().subscribe({
      next: (fornecedores) => {
        this.allFornecedores = fornecedores;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar fornecedores', err);
        this.snackBar.open('Falha ao carregar lista de fornecedores.', 'Erro', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  setupCepLookup(): void {
    this.empresaForm.get('cep')?.valueChanges.pipe(
      debounceTime(600),
      filter(cep => !!cep && cep.length === 8 && (this.empresaForm.get('cep')?.valid ?? false)),
      tap(() => this.isCepLoading = true),
      switchMap(cep => this.cepService.consultarCep(cep).pipe(
        catchError(() => {
          return of(null);
        })
      )),
      tap(() => this.isCepLoading = false)
    ).subscribe(cepData => {
      if (cepData) {
        this.snackBar.open(`CEP: ${cepData.logradouro}, ${cepData.bairro}, ${cepData.cidade}-${cepData.uf}`, 'Ok', { duration: 4000 });
      } else if (this.empresaForm.get('cep')?.valid && !this.isCepLoading) {
        this.snackBar.open('CEP não encontrado.', 'Erro', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.empresaForm.invalid) {
      this.snackBar.open('Por favor, corrija os erros no formulário.', 'Atenção', { duration: 3000 });
      this.empresaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const empresaData = this.empresaForm.value;

    const operation = this.isEditMode && this.empresaId
      ? this.empresaService.updateEmpresa(this.empresaId, empresaData)
      : this.empresaService.createEmpresa(empresaData);

    operation.subscribe({
      next: () => {
        this.snackBar.open(`Empresa ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`, 'Ok', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/empresas']);
      },
      error: (err) => {
        const message = err.error?.title || err.error?.message || `Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} empresa.`;
        this.snackBar.open(message, 'Erro', { duration: 5000 });
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/empresas']);
  }
}
