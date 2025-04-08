import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, merge, of, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, takeUntil, catchError, map, startWith } from 'rxjs/operators';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Fornecedor, Page } from '../../../models/fornecedor.model';
import { FornecedorService } from '../fornecedor.service';

@Component({
  selector: 'app-fornecedor-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './fornecedor-list.component.html',
  styleUrls: ['./fornecedor-list.component.scss']
})
export class FornecedorListComponent implements OnInit, AfterViewInit, OnDestroy {

  dataSource = new MatTableDataSource<Fornecedor>([]);
  displayedColumns: string[] = ['nome', 'identificadorFiscal', 'email', 'tipoPessoa', 'actions'];
  isLoading = true;
  filterForm: FormGroup;
  initialPageSize = 10;
  totalElements = 0;

  @ViewChild(MatPaginator) private _paginator!: MatPaginator;

  private destroy$ = new Subject<void>();

  constructor(
    private fornecedorService: FornecedorService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      nome: [''],
      identificadorFiscal: ['']
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
        if (this._paginator) {
            this.setupDataLoadingStream();
            this.triggerReloadManually();
        } else {
            console.error('[FornecedorListComponent] Paginator NOT found even after scheduling!');
            this.isLoading = false;
            this.snackBar.open('Erro crítico: Paginator não inicializado.', 'Erro', { duration: 5000 });
            this.cdRef.detectChanges();
        }
    });
  }

  setupDataLoadingStream(): void {
     if (!this._paginator) {
         console.error('[FornecedorListComponent] Paginator not available for stream setup!');
         this.isLoading = false;
         this.snackBar.open('Erro interno crítico: Paginator não disponível para stream.', 'Erro', { duration: 5000 });
         this.cdRef.detectChanges();
         return;
     }

    merge(
      this.filterForm.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
            if (this._paginator) this._paginator.pageIndex = 0;
        })
      ),
      this._paginator.page.pipe(startWith(null))
    )
      .pipe(
        tap(() => {
            this.isLoading = true;
        }),
        switchMap(() => {
          const pageIndex = this._paginator?.pageIndex ?? 0;
          const pageSize = this._paginator?.pageSize ?? this.initialPageSize;
          const filters = this.filterForm.value;

          return this.fornecedorService.getFornecedores(
            pageIndex,
            pageSize,
            filters.nome || undefined,
            filters.identificadorFiscal || undefined
          ).pipe(
            catchError(err => {
              console.error('[FornecedorListComponent] Error caught inside getFornecedores pipe:', err);
              this.snackBar.open('Erro ao carregar fornecedores.', 'Erro', { duration: 3000 });
              return of({ content: [], totalElements: 0, totalPages: 0, size: pageSize, number: pageIndex });
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data: Page<Fornecedor>) => {
        this.isLoading = false;
        this.totalElements = data?.totalElements ?? 0;
        this.dataSource.data = data?.content ?? [];
        this.cdRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
     if (this._paginator?.pageIndex !== 0) {
        this._paginator?.firstPage();
     } else {
        this.triggerReloadManually();
     }
  }

   private triggerReloadManually(): void {
     if (!this._paginator) {
       console.error('[FornecedorListComponent] Paginator not available in triggerReloadManually!');
       this.isLoading = false;
       this.cdRef.detectChanges();
       return;
     }
     this.isLoading = true;
     this.cdRef.detectChanges();
     const pageIndex = this._paginator.pageIndex;
     const pageSize = this._paginator.pageSize;
     const filters = this.filterForm.value;

     this.fornecedorService.getFornecedores(
         pageIndex, pageSize, filters.nome || undefined, filters.identificadorFiscal || undefined
     ).pipe(
         catchError(err => {
             this.snackBar.open('Erro ao recarregar fornecedores.', 'Erro', { duration: 3000 });
             return of({ content: [], totalElements: 0, totalPages: 0, size: pageSize, number: pageIndex });
         })
     ).subscribe(data => {
         this.isLoading = false;
         this.totalElements = data?.totalElements ?? 0;
         this.dataSource.data = data?.content ?? [];
         this.cdRef.detectChanges();
     });
   }

  deleteFornecedor(id: number | undefined): void {
    if (!id) return;

    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      this.isLoading = true;
      this.cdRef.detectChanges();

      this.fornecedorService.deleteFornecedor(id).subscribe({
        next: () => {
          this.snackBar.open('Fornecedor excluído!', 'Ok', { duration: 3000 });
          this.triggerReloadManually();
        },
        error: (err) => {
          const errorMsg = err.error?.title || err.error?.message || 'Erro ao excluir.';
          this.snackBar.open(errorMsg, 'Erro', { duration: 5000 });
          this.isLoading = false;
          this.cdRef.detectChanges();
        }
      });
    }
  }
}
