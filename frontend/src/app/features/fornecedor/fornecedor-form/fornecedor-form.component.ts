import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { switchMap, catchError, tap, debounceTime, filter, first, map, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { FornecedorService } from '../fornecedor.service';
import { EmpresaService } from '../../empresa/empresa.service';
import { CepService } from '../../../core/cep.service';
import { Fornecedor } from '../../../models/fornecedor.model';
import { Empresa } from '../../../models/empresa.model';

@Component({
  selector: 'app-fornecedor-form',
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
    MatRadioModule,
    MatDatepickerModule
  ],
  templateUrl: './fornecedor-form.component.html',
  styleUrls: ['./fornecedor-form.component.scss']
})
export class FornecedorFormComponent implements OnInit, OnDestroy {
  fornecedorForm!: FormGroup;
  isEditMode = false;
  fornecedorId: number | null = null;
  isLoading = false;
  isCepLoading = false;
  allEmpresas: Empresa[] = [];
  private paranaEmpresaIds: Set<number> = new Set();
  private empresasLoaded = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private fornecedorService: FornecedorService,
    private empresaService: EmpresaService,
    private cepService: CepService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadEmpresas();
    this.setupConditionalValidators();
    this.setupCepLookup();

    this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.isEditMode = true;
          this.fornecedorId = +idParam;
          this.isLoading = true;
          return this.fornecedorService.getFornecedor(this.fornecedorId);
        } else {
          this.isEditMode = false;
          this.fornecedorId = null;
          return of(null);
        }
      }),
      first(),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (fornecedor) => {
        if (fornecedor) {
          this.fornecedorForm.patchValue(fornecedor);
          this.fornecedorForm.get('tipoPessoa')?.updateValueAndValidity();
          this.fornecedorForm.get('empresaIds')?.setValue((fornecedor as any).empresaIds || []);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar dados do fornecedor.', 'Erro', { duration: 3000 });
        console.error(err);
        this.isLoading = false;
        this.router.navigate(['/fornecedores']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm(): void {
    this.fornecedorForm = this.fb.group({
      tipoPessoa: ['FISICA', Validators.required],
      identificadorFiscal: ['', [Validators.required]],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      cep: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      rg: [''],
      dataNascimento: [null],
      empresaIds: [[]]
    });
  }

  setupConditionalValidators(): void {
    const tipoPessoaControl = this.fornecedorForm.get('tipoPessoa');
    const identificadorControl = this.fornecedorForm.get('identificadorFiscal');
    const rgControl = this.fornecedorForm.get('rg');
    const dataNascimentoControl = this.fornecedorForm.get('dataNascimento');

    tipoPessoaControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipo => {
        if (tipo === 'FISICA') {
          identificadorControl?.setValidators([Validators.required, Validators.pattern(/^\d{11}$/)]);
          rgControl?.setValidators([Validators.required, Validators.maxLength(20)]);
          dataNascimentoControl?.setValidators([Validators.required, this.pastDateValidator]);
        } else {
          identificadorControl?.setValidators([Validators.required, Validators.pattern(/^\d{14}$/)]);
          rgControl?.clearValidators();
          dataNascimentoControl?.clearValidators();
        }
        identificadorControl?.updateValueAndValidity();
        rgControl?.updateValueAndValidity();
        dataNascimentoControl?.updateValueAndValidity();
      });

    tipoPessoaControl?.updateValueAndValidity({ emitEvent: true });
  }

  pastDateValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && new Date(control.value) >= new Date()) {
      return { futureDate: true };
    }
    return null;
  }

  loadEmpresas(): void {
    this.empresaService.getEmpresas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresas) => {
          this.allEmpresas = empresas as Empresa[];
          this.empresasLoaded = true;
          this.identifyParanaCompanies();
          this.fornecedorForm.get('dataNascimento')?.updateValueAndValidity();
        },
        error: (err) => {
          console.error('Erro ao carregar empresas', err);
          this.snackBar.open('Falha ao carregar lista de empresas para associação.', 'Erro', { duration: 3000 });
        }
      });
  }

  identifyParanaCompanies(): void {
    this.paranaEmpresaIds.clear();
    const cepPromises = this.allEmpresas
      .filter(empresa => empresa.cep)
      .map(empresa =>
        this.cepService.consultarCep(empresa.cep).pipe(
          first(),
          map(cepData => ({ id: empresa.id, isParana: cepData?.uf?.toUpperCase() === 'PR' }))
        ).toPromise()
      );

    Promise.all(cepPromises).then(results => {
      results.forEach(result => {
        if (result?.isParana && result.id) {
          this.paranaEmpresaIds.add(result.id);
        }
      });
      this.fornecedorForm.get('dataNascimento')?.updateValueAndValidity();
    }).catch(error => {
      console.error("Error checking company CEPs for Parana rule:", error);
    });
  }

  setupCepLookup(): void {
    this.fornecedorForm.get('cep')?.valueChanges.pipe(
      debounceTime(600),
      filter(cep => !!cep && cep.length === 8 && (this.fornecedorForm.get('cep')?.valid ?? false)),
      tap(() => this.isCepLoading = true),
      switchMap(cep => this.cepService.consultarCep(cep).pipe(catchError(() => of(null)))),
      tap(() => this.isCepLoading = false),
      takeUntil(this.destroy$)
    ).subscribe((cepData: any) => {
      if (cepData) {
        this.snackBar.open(`CEP: ${cepData?.logradouro}, ${cepData?.bairro}, ${cepData?.cidade}-${cepData?.uf}`, 'Ok', { duration: 4000 });
      } else if (this.fornecedorForm.get('cep')?.valid && !this.isCepLoading) {
        this.snackBar.open('CEP não encontrado.', 'Erro', { duration: 3000 });
      }
    });
  }

  validateParanaAgeRule(): boolean {
    const tipoPessoa = this.fornecedorForm.get('tipoPessoa')?.value;
    const dataNascimentoControl = this.fornecedorForm.get('dataNascimento');
    const selectedEmpresaIds = this.fornecedorForm.get('empresaIds')?.value || [];

    if (tipoPessoa === 'FISICA' && dataNascimentoControl?.value) {
      const birthDate = new Date(dataNascimentoControl.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        const isLinkedToParana = selectedEmpresaIds.some((id: number) => this.paranaEmpresaIds.has(id));
        if (isLinkedToParana) {
          this.snackBar.open('ERRO: Fornecedor menor de idade não pode ser associado a empresas do Paraná.', 'Erro', { duration: 5000 });
          return false;
        }
      }
    }
    return true;
  }

  onSubmit(): void {
    if (this.fornecedorForm.invalid) {
      this.snackBar.open('Por favor, corrija os erros no formulário.', 'Atenção', { duration: 3000 });
      this.fornecedorForm.markAllAsTouched();
      return;
    }

    if (!this.validateParanaAgeRule()) {
      return;
    }

    this.isLoading = true;
    let formData = { ...this.fornecedorForm.value };

    if (formData.dataNascimento instanceof Date) {
      formData.dataNascimento = formData.dataNascimento.toISOString().split('T')[0];
    } else if (formData.dataNascimento) {
      try {
        formData.dataNascimento = new Date(formData.dataNascimento).toISOString().split('T')[0];
      } catch (e) {}
    }

    const operation = this.isEditMode && this.fornecedorId
      ? this.fornecedorService.updateFornecedor(this.fornecedorId, formData)
      : this.fornecedorService.createFornecedor(formData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Fornecedor ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`, 'Ok', { duration: 3000 });
          this.isLoading = false;
          this.router.navigate(['/fornecedores']);
        },
        error: (err) => {
          const message = err.error?.title || err.error?.message || `Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} fornecedor.`;
          this.snackBar.open(message, 'Erro', { duration: 5000 });
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/fornecedores']);
  }

  get isPessoaFisica(): boolean {
    return this.fornecedorForm.get('tipoPessoa')?.value === 'FISICA';
  }
}
