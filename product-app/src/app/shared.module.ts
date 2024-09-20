import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatNativeDateModule } from "@angular/material/core";
import { MatDialogModule } from "@angular/material/dialog";

const MATERIAL_MODULES = [
  MatIconModule,
  MatDividerModule,
  MatButtonModule,
  MatMenuModule,
  MatCardModule,
  MatFormFieldModule,
  MatCheckboxModule,
  MatInputModule,
  MatDialogModule,
  MatTooltipModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatSelectModule,
  MatSidenavModule,
  MatProgressSpinnerModule,
  NgxMatSelectSearchModule,
  MatToolbarModule
];

@NgModule({

  declarations: [

  ],
  imports: [
    FlexLayoutModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MATERIAL_MODULES,
  ],
  exports: [
    FormsModule,
    FlexLayoutModule,
    MATERIAL_MODULES,
    ReactiveFormsModule,
    CommonModule,
  ],
  providers: [
  ],
})
export class SharedModule {
}
