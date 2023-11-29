# CUSTOM VIEWS THAT ARE NOT USED ANYMORE.


"""

def login_view(request):
    # Render the form only if the user is not logged in
    if not request.user.is_authenticated:
        if not request.method == "POST":
            form = LoginForm()
            return render(request, 'users/login.html', {
                "form": form
            })
        
        form = LoginForm(request.POST)

        if not form.is_valid(): 
            return render(request, 'users/login.html', {
                "form": form
            })
        
        data = form.cleaned_data
        
        # Verify if the username and password are correct credentials for opening an account.
        user = authenticate(username = data['username'], password = data['password'])


        # If an account was found, log the user in.
        if user is not None:
            login(request, user)

            next_url = request.POST.get('next')

            if next_url:
                messages.success(request, "Logged in successfully!")
                return redirect(next_url)
            else:
                messages.success(request, "Logged in successfully!")
                return HttpResponseRedirect(reverse('boards', kwargs={'username': request.user.username}))

        else:
            messages.error(request, "Invalid username and/or password!")
            return render(request, 'users/login.html', {
                "form": form
            })
        
    else:
        return HttpResponseRedirect(reverse('boards', kwargs={"username": request.user.username}))

@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('index'))

"""