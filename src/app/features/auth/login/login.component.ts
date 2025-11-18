import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
   styleUrls: ['./login.component.scss']
})
export class LoginComponent {
loginForm!: FormGroup;
  signupForm!: FormGroup;
  loading = false;
  errorMessage = '';
  isSignupMode = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Formulaire de login existant
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Nouveau formulaire de signup
    this.signupForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Méthode existante - non modifiée
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Invalid username or password';
        }
      });
    }
  }

  // Nouvelle méthode pour le signup
  onSignup(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { confirmPassword, ...signupData } = this.signupForm.value;

      this.authService.signup(signupData).subscribe({
        next: (response) => {
          this.loading = false;
          // Basculer vers le mode login après inscription réussie
          this.isSignupMode = false;
          this.loginForm.reset();
          // Optionnel : afficher un message de succès
          alert('Account created successfully! Please sign in.');
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Signup failed. Please try again.';
        }
      });
    }
  }

  // Nouvelle méthode pour basculer entre login et signup
  toggleMode(): void {
    this.isSignupMode = !this.isSignupMode;
    this.errorMessage = '';
    this.loginForm.reset();
    this.signupForm.reset();
  }

  // Validateur personnalisé pour vérifier la correspondance des mots de passe
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}