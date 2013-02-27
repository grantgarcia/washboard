from django import forms
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.models import User
from django.shortcuts import render, redirect

class LoginForm(forms.Form):
    username = forms.CharField(
        max_length=30,
        error_messages={
            'required': 'Please enter your name.',
        },
        widget=forms.TextInput(attrs={'placeholder': 'Username'}),
    )
    password = forms.CharField(
        label='Password',
        error_messages={
            'required': 'Please enter your password.',
        },
        widget=forms.PasswordInput(attrs={'placeholder': 'Password'}),
    )

def main(request):
    if request.user.is_authenticated():
        return redirect('/dash')
    return render(request, 'main.tpl', {'form': LoginForm()})

def login(request):
    if request.method == 'GET':
        return redirect('/')
    form = LoginForm(request.POST)
    if not form.is_valid():
        messages.error(request, 'Invalid request.')
        return redirect('/')
    
    data = form.cleaned_data
    user = authenticate(username=data['username'], password=data['password'])
    if not user:
        messages.error(request, 'Incorrect username or password.')
        return redirect('/')
    elif not user.is_active:
        messages.error(request, 'Sorry, your account is disabled.')
        return redirect('/')
    auth_login(request, user)
    return redirect('/')