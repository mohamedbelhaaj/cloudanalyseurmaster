import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MigrationsTableComponent } from './migrations-table.component';

describe('MigrationsTableComponent', () => {
  let component: MigrationsTableComponent;
  let fixture: ComponentFixture<MigrationsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MigrationsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MigrationsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
