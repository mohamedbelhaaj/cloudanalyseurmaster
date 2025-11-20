import { TestBed } from '@angular/core/testing';

import { SendToAdminService } from './sendtoadmin.service';

describe('SendtoadminService', () => {
  let service: SendToAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SendToAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
