import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// Mock pour ActivatedRoute
const mockActivatedRoute = {
  snapshot: { 
    paramMap: new Map(),
    queryParamMap: new Map() 
  },
  params: of({}),
  queryParams: of({}),
  fragment: of(null)
};

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [
      { provide: ActivatedRoute, useValue: mockActivatedRoute }
    ]
  });
});