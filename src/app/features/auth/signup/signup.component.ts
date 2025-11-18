import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

loading: any;
loginForm: any;
isLoginMode = true;


resetPassword() {
throw new Error('Method not implemented.');
}
onLogin() {
throw new Error('Method not implemented.');
}

message: any;
switchMode() {
  this.isLoginMode = !this.isLoginMode;
}
onSignupSubmit() {
throw new Error('Method not implemented.');
}
signupForm: any;
onGoToLogin() {
throw new Error('Method not implemented.');
}
onSignUp() {
throw new Error('Method not implemented.');
}
onForgotPassword() {
throw new Error('Method not implemented.');
}
}
