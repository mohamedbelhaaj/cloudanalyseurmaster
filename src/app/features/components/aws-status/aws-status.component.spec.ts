import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsStatusComponent } from './aws-status.component';

describe('AwsStatusComponent', () => {
  let component: AwsStatusComponent;
  let fixture: ComponentFixture<AwsStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AwsStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AwsStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
