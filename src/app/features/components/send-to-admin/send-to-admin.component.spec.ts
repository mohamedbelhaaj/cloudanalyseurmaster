import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendToAdminComponent } from './send-to-admin.component';

describe('SendToAdminComponent', () => {
  let component: SendToAdminComponent;
  let fixture: ComponentFixture<SendToAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendToAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendToAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
