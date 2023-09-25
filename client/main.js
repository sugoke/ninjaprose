import {
  Template
} from 'meteor/templating';
import {
  ReactiveVar
} from 'meteor/reactive-var';
import '../lib/router.js'
//import { Template } from 'meteor/blaze';
import Swal from 'sweetalert2'
import moment from 'moment';
import './main.html';
import { Accounts } from 'meteor/accounts-base';

const stripePub = Meteor.settings.public.STRIPE_PUBLIC_KEY;

import { TAPi18n } from 'meteor/tap:i18n';
import { Tracker } from 'meteor/tracker';


//let stripe; // Declare at the top-level scope to make it accessible in other functions
let cardElement; // Declare at the top-level scope to make it accessible in other functions

Meteor.startup(() => {
  // Initialize i18n
  TAPi18n.setLanguage('en'); // Set the default language


  // Optionally, you can load translations here
  // TAPi18n.loadTranslations({ ... });
});


Tracker.autorun(() => {
  const user = Meteor.user();
  if (user && user.profile && user.profile.preferredLanguage) {
    const preferredLanguage = user.profile.preferredLanguage;

    TAPi18n.setLanguage(preferredLanguage)
      .done(function () {
        console.log(`Language switched to ${preferredLanguage}`);
      })
      .fail(function (error_message) {
        // Handle the error
        console.log(error_message);
      });
  }
});


// When the user navigates to the verification link provided in the email
Accounts.onEmailVerificationLink((token, done) => {
  Accounts.verifyEmail(token, (error) => {
    if (error) {
      // If there's an error, show it using SweetAlert
      const errorMsg = TAPi18n.__('verification_failed');
      const errorTitle = TAPi18n.__('error');
      Swal.fire(errorTitle, errorMsg, 'error');
    } else {
      // If the verification is successful, show a success message
      const successMsg = TAPi18n.__('verification_success');
      const successTitle = TAPi18n.__('success');
      Swal.fire(successTitle, successMsg, 'success');
      done();  // Important: Call the done function to continue with the default behavior if needed.
    }
  });



  Accounts.onResetPasswordLink((token, done) => {
    const title = TAPi18n.__('reset_your_password');
    const inputPlaceholder = TAPi18n.__('enter_new_password');
    const confirmButtonText = TAPi18n.__('reset_password_btn');
    const successMsg = TAPi18n.__('success_reset');
    const successTitle = TAPi18n.__('success');

    Swal.fire({
      title: title,
      input: 'password',
      inputPlaceholder: inputPlaceholder,
      inputAttributes: {
        minlength: '7',
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      showLoaderOnConfirm: true,
      preConfirm: (newPassword) => {
        return new Promise((resolve, reject) => {
          Accounts.resetPassword(token, newPassword, (error) => {
            if (error) {
              const errorMsg = TAPi18n.__('unable_reset_password');
              reject(errorMsg);
            } else {
              resolve();
            }
          });
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire(successTitle, successMsg, 'success');
        done();
      }
    }).catch(Swal.hideLoading); // Hide loading state on user cancel or any error
  });


});

Meteor.startup(() => {



});

function processRequest() {
  document.getElementById('overlay').style.display = 'block';

  $("#polishedText").slideDown("slow");
  $("#copyBtn1").slideDown("slow");
  $("#emailBtn1").slideDown("slow");

  const text = document.getElementById('rawText').value;
  const formality = document.getElementById('formalitySelect').value;
  const language = document.getElementById('languageSelect').value;

  Meteor.call('getPolishedText', text, formality, language, function(error, result) {
    if (error) {
      console.error("Server error", error);
    } else {
      document.getElementById('polishedText').value = result;
      document.getElementById('overlay').style.display = 'none';
    }
  });

  // Increment user's submission counter
  Meteor.call('incrementUserCounter', Meteor.userId());
}


Template.formTemplate.helpers({
  formalityOptions: function() {
    return [
      TAPi18n.__('informal'),
      TAPi18n.__('neutral'),
      TAPi18n.__('formal')
    ];
  },
  languageOptions: function() {
    return [
      TAPi18n.__('sameLanguage'),
      TAPi18n.__('english'),
      TAPi18n.__('spanish'),
      TAPi18n.__('french'),
      TAPi18n.__('german'),
      TAPi18n.__('italian')
    ];
  }
});


Template.formTemplate.helpers({

  hasVerifiedEmail: function() {
     const user = Meteor.user();
     if (!user) {
       return false;
     }

     const email = user && user.emails && user.emails[0];
     return email && email.verified;
   },

  clientHasCancelled() {
    const user = Meteor.user();
    return user && user.profile && user.profile.clientHasCancelled;
  },

  hasUserSubscribed() {
    const user = Meteor.user();
    return user && user.profile && user.profile.isPaying; // adjust this based on your actual data structure
  }
});

Template.navBar.helpers({

  emailVerified: function() {
    const user = Meteor.user();
    if (user && user.emails && user.emails.length > 0) {
      return user.emails[0].verified;
    }
    return false;
  },



  'currentUser': function() {
    return Meteor.user();
  },

  'email': function() {
     return Meteor.user() && Meteor.user().emails && Meteor.user().emails[0] && Meteor.user().emails[0].address;
   },

   isPaying() {
       const user = Meteor.user();
       return user && user.profile.isPaying;
     },
     cancelAtPeriodEnd() {
       const user = Meteor.user();
       return user && user.profile.cancelAtPeriodEnd;
     },
     shouldShowNextBillingDate() {
       const user = Meteor.user();
       return user && user.profile.subscriptionEndsAt && (user.profile.isPaying || user.profile.cancelAtPeriodEnd);
     },
     cancellationInProgress() {
       const user = Meteor.user();
       return user && user.profile && 'cancellationInProgress' in user.profile && user.profile.cancellationInProgress;
     },
     subscriptionEndsAt() {
       const user = Meteor.user();
       if (user && user.profile.currentPeriodEnd) {
         return moment.unix(user.profile.currentPeriodEnd).format("MMMM Do, YYYY");
       }
       return "N/A";
     },
     serviceEndsAt() {
       const user = Meteor.user();
       if (user && user.profile.serviceEndsAt) {
         return moment.unix(user.profile.serviceEndsAt).format("MMMM Do, YYYY");
       }
       return "N/A";
     },
 // ...other existing helpers...

 currentUserProfile() {
     const user = Meteor.user();
     if (user && user.profile) {
       console.log("Current period end:", user.profile.currentPeriodEnd);
     }
     return user ? user.profile : null;
   },
   currentPeriodEndFormatted() {
     if (this.currentPeriodEnd) {
       console.log("Formatted date:", moment.unix(this.currentPeriodEnd).format('MMMM Do, YYYY'));
       return moment.unix(this.currentPeriodEnd).format('MMMM Do, YYYY');
     } else {
       console.log("currentPeriodEnd is not available or not a valid timestamp");
       return null;
     }
   },
 // ...other existing helpers...
});

Template.navBar.events({

  'click .btn[data-target="#checkoutModal"]': function(event, template) {
  $('#profileModal').modal('hide'); // Close the profileModal
  $('#checkoutModal').modal('show'); // Open the checkoutModal
},

'click #resendVerificationLink': function(event) {
  event.preventDefault();

  Meteor.call('resendVerificationEmail', (error, response) => {
    if (error) {
      console.error("Error resending verification email:", error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: TAPi18n.__('errorSendingEmail')
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: TAPi18n.__('verificationEmailSent'),
        text: TAPi18n.__('checkInbox')
      });
    }
  });
},


   'click #confirmUnsubscribeButton': function() {

     console.log("user clicked yes twice")

   },

   'click #unsubscribeLink': function(event, template) {
     event.preventDefault();

     Swal.fire({
       title: TAPi18n.__('areYouSure'),
       text: TAPi18n.__('cancelSubscriptionQuestion'),
       icon: 'warning',
       showCancelButton: true,
       confirmButtonText: TAPi18n.__('yes'),
       cancelButtonText: TAPi18n.__('no')
     }).then((result) => {
       if (result.isConfirmed) {
         const user = Meteor.user();
         const subscriptionId = user.profile.subscriptionId;

         Meteor.call('cancelSubscription', subscriptionId, (error, result) => {
           if (error) {
             console.log("An error occurred while canceling the subscription:", error);

             Swal.fire({
               title: 'Error!',
               text: TAPi18n.__('errorCanceling'),
               icon: 'error',
               confirmButtonText: TAPi18n.__('ok')
             });
             return;
           }

           if (result) {
             console.log("Subscription successfully canceled.");

             Swal.fire({
               title: 'Success!',
               text: TAPi18n.__('successCanceling'),
               icon: 'success',
               confirmButtonText: TAPi18n.__('ok')
             }).then(() => {
               $('#yourModalId').modal('hide');
             });
           }
         });
       }
     });
   }



});




Template.formTemplate.events({

  'click #emailBtn1'(event, instance) {
    event.preventDefault();
    let polishedText = instance.find("#polishedText").value;
    let mailtoLink = document.createElement('a');
    mailtoLink.href = "mailto:?body=" + encodeURIComponent(polishedText);
    mailtoLink.style.display = 'none';
    document.body.appendChild(mailtoLink);
    mailtoLink.click();
    document.body.removeChild(mailtoLink);
  },

  'click #copyBtn1': function(event, instance) {

    event.preventDefault();

    const polishedText = document.getElementById('polishedText').value;

    navigator.clipboard.writeText(polishedText)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Error in copying text: ', err);
      });
  },

  'click #copyBtn2': function(event, instance) {

    event.preventDefault();

    const replyToMessage = document.getElementById('replyToMessage').value;

    navigator.clipboard.writeText(replyToMessage)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Error in copying text: ', err);
      });
  },

  'click #clearBtn1': function(event, template) {
    event.preventDefault();
    template.find("#rawText").value = '';
  },

  'click #pasteBtn1': function(event, instance) {
    event.preventDefault();

    if (!navigator.clipboard) {
      Swal.fire({
        icon: 'error',
        title: TAPi18n.__('oops'),
        text: TAPi18n.__('clipboardNotAvailable'),
      });

      return;
    }

    navigator.clipboard.readText()
      .then(text => {
        document.getElementById('rawText').value = text;
      })
      .catch(err => {
        console.error('Failed to read clipboard contents: ', err);
      });
  },


  'click #submit': function(event, instance) {
    event.preventDefault();

    // Check user request limit
    Meteor.call('countRequestsLastHour', Meteor.userId(), (error, count) => {
      if (error) {
        console.error("Server error", error);
      } else {
        // Fetch the current user document
        const user = Meteor.user();

        // Check if user is a paying user and exceeded hourly limit
        if (user && user.profile && user.profile.isPaying && count > 9) {
          // Show the limit modal
          $('#hourlyLimit').modal('show');
          return;
        }

        // Check if user is a non-paying user and exceeded daily limit
        else if (user && user.profile && !user.profile.isPaying && user.profile.counter > 0) {
          // Show the subscription modal
          $('#subscribeModal').modal('show');
          return;
        } else {
          document.getElementById('overlay').style.display = 'block';
        }

        $("#polishedText").slideDown("slow");
        $("#copyBtn1").slideDown("slow");
        $("#emailBtn1").slideDown("slow");

        const text = document.getElementById('rawText').value;
        const formality = document.getElementById('formalitySelect').value;
        const language = document.getElementById('languageSelect').value;

        Meteor.call('incrementUserCounter', Meteor.userId(), (error, result) => {
          if (error) {
            console.error("Server error", error);
          }
        });

        Meteor.call('getPolishedText', text, formality, language, function(error, result) {
          if (error) {
            console.error("Server error", error);
          } else {
            document.getElementById('polishedText').value = result;
            document.getElementById('overlay').style.display = 'none';
               document.body.style.overflow = 'auto'; // Reset the overflow property
          }
        });

      }
    });
  },





  //second tab1


  'click #pasteBtn2': function(event, instance) {
    event.preventDefault();

    if (!navigator.clipboard) {
      Swal.fire({
        icon: 'error',
        title: TAPi18n.__('oops'),
        text: TAPi18n.__('clipboardNotAvailable'),
      });

      return;
    }

    navigator.clipboard.readText()
      .then(text => {
        document.getElementById('messageToReplyTo').value = text;
      })
      .catch(err => {
        console.error('Failed to read clipboard contents: ', err);
      });
  },


  'click #clearBtn2': function(event, template) {
    event.preventDefault();
    template.find("#messageToReplyTo").value = '';
  },

  ///////////////////////////////////////////////////////////

  'click #clearBtn3': function(event, template) {
    event.preventDefault();
    template.find("#answer").value = '';
  },



  'click #pasteBtn2': function(event, instance) {
  event.preventDefault();

  if (!navigator.clipboard) {
    Swal.fire({
      icon: 'error',
      title: TAPi18n.__('oops'),
      text: TAPi18n.__('clipboardNotAvailable'),
    });

    return;
  }

  navigator.clipboard.readText()
    .then(text => {
      document.getElementById('messageToReplyTo').value = text;
    })
    .catch(err => {
      console.error('Failed to read clipboard contents: ', err);
    });
},


  'click #clearBtn3': function(event, template) {
    event.preventDefault();
    template.find("#answer").value = '';
  },



  'click #submit2': function(event, instance) {
    event.preventDefault();

    document.getElementById('overlay').style.display = 'block';


    $("#replyToMessage").slideDown("slow");
    $("#copyBtn2").slideDown("slow");


    const text = document.getElementById('messageToReplyTo').value;
    const formality = document.getElementById('tonality2').value;
    const language = document.getElementById('language2').value;
    const answer = document.getElementById('answer').value;

    Meteor.call('getReplyToMessage', text, formality, language, answer, function(error, result) {
      if (error) {
        console.error("Server error", error);
      } else {
        document.getElementById('replyToMessage').value = result;
        document.getElementById('overlay').style.display = 'none';
      }
    });
  }



});


Meteor.call('getApiKey', function(error, result) {
  if (error) {
    console.error('Error retrieving API key:', error);
  } else {
    console.log('API key:', result);
  }
});

Template.formTemplate.helpers({
  showRegisterForm() {
    return Session.get('showRegisterForm');
  },
  showForgotPasswordForm() {
    return Session.get('showForgotPasswordForm');
  },
});




Template.myLoginForm.events({

  'click #forgot-password-link'(event) {
    event.preventDefault();


    Session.set('showForgotPasswordForm', true);
    Session.set('showRegisterForm', false);
  },

  'submit #login-form'(event) {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    Meteor.loginWithPassword(email, password, function(err) {
      if (err) {
        // Show the error modal
        $('#errorModalText').text(TAPi18n.__('unknownUserOrWrongPassword')); // Update the modal text with the specific error message
        $('#errorModal').modal('show');
      } else {
        // handle successful login
      }
    });
  },



  'click #register-link'(event) {
    event.preventDefault();
    Session.set('showRegisterForm', true);
    Session.set('showForgotPasswordForm', false);
  },

  'click #login-link'(event) {
    event.preventDefault();
    Session.set('showForgotPasswordForm', false);
    Session.set('showRegisterForm', false);
  },

  'submit #forgot-password-form'(event) {
    event.preventDefault();

    const email = event.target.email.value;

    Accounts.forgotPassword({ email }, function(err) {
      if (err) {
        Swal.fire({
          icon: 'error',
          title: TAPi18n.__('oops'),
          text: err.message,
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: TAPi18n.__('success'),
          text: TAPi18n.__('passwordResetEmailSent'),
        });
        Session.set('showForgotPasswordForm', false);
      }
    });
  },


  // You can add more event handlers here for other elements

});


Template.myRegisterForm.events({
  'submit #register-form'(event) {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    Meteor.call('createUserAccount', email, password, function(err) {
      if (err) {
        // handle error
        Swal.fire({
  icon: 'error',
  title: 'Oops...',
  text: err.message,
});
      } else {
        // handle successful registration
        Session.set('showRegisterForm', false);

        Meteor.loginWithPassword(email, password, function(err) {
          if (err) {
            // handle error
          } else {
            // handle successful login
          }
        });
      }
    });



  },

  'click #login-link'(event) {
    event.preventDefault();

    // hide registration form and show login form
    Session.set('showRegisterForm', false);
  },
});

Template.myLoginForm.helpers({
  showLoginForm: function() {
    return !Session.get('showRegisterForm') && !Session.get('showForgotPasswordForm');
  },
  showRegisterForm: function() {
    return Session.get('showRegisterForm');
  },
  showForgotPasswordForm: function() {
    return Session.get('showForgotPasswordForm');
  },
});



Template.formTemplate.helpers({
  showRegisterForm() {
    return Session.get('showRegisterForm');
  },
});

Template.myForgotPasswordForm.events({
  'submit #forgot-password-form'(event) {
    event.preventDefault();

    const email = event.target.email.value;

    Accounts.forgotPassword({ email }, function(err) {
      if (err) {
        Swal.fire({
          icon: 'error',
          title: TAPi18n.__('oops'),
          text: err.message,
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: TAPi18n.__('success'),
          text: TAPi18n.__('passwordResetEmailSent'),
        });
      }
    });
  },
  'click #login-link'(event) {
    event.preventDefault();
    Session.set('showForgotPasswordForm', false);
    Session.set('showRegisterForm', false);
  }
});





Template.navBar.events({
  'click #logout-button'() {
    Swal.fire({
      title: TAPi18n.__('areYouSure'),
      text: TAPi18n.__('willBeLoggedOut'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: TAPi18n.__('yesLogOut'),
      cancelButtonText: TAPi18n.__('cancel')
    }).then((result) => {
      if (result.isConfirmed) {
        Meteor.logout(function(err) {
          if (err) {
            console.log("Error logging out: ", err);
            Swal.fire(TAPi18n.__('oops'), TAPi18n.__('somethingWentWrong'), 'error');
          } else {
            $('#profileModal').modal('hide');
            console.log("Successfully logged out");
            Swal.fire(TAPi18n.__('loggedOut'), TAPi18n.__('youHaveBeenLoggedOut'), 'success');
          }
        });
      }
    });
  },
  'click #unsubscribe-button'(event) {
    // implement your logic for unsubscribing a user
  },
});



//////////////////


Template.checkoutForm.onRendered(function() {
  stripe = Stripe(Meteor.settings.public.STRIPE_PUBLIC_KEY);
  const elements = stripe.elements();
  cardElement = elements.create('card');
  cardElement.mount('#payment-element');

  const currencyPriceDiv = document.getElementById('currency-price');

  // Initialize with EUR as the default
  currencyPriceDiv.textContent = TAPi18n.__('eurPerMonth', { price: "8.90" });

  // Add event listeners to currency buttons
  const currencyButtons = document.querySelectorAll('.currency-button');
  currencyButtons.forEach((btn) => {
    btn.addEventListener('click', function(e) {
      currencyButtons.forEach((btn) => btn.classList.remove('active'));
      btn.classList.add('active');

      const selectedCurrency = btn.querySelector('input').value;
      if (selectedCurrency === 'EUR') {
        currencyPriceDiv.textContent = TAPi18n.__('eurPerMonth', { price: "8.90" });
      } else if (selectedCurrency === 'USD') {
        currencyPriceDiv.textContent = TAPi18n.__('usdPerMonth', { price: "9.90" });
      }
    });
  });
});


Template.checkoutForm.helpers({
  userEmail() {
    const user = Meteor.user();
    return user && user.emails && user.emails[0].address;
  },
});

Template.checkoutForm.events({
  'submit #payment-form': async function(event, template) {
  event.preventDefault();

  // Check if card holder name is entered
const cardHolderName = document.getElementById('card-holder-name').value;
if (!cardHolderName) {
  console.log("Card holder name is required.");
  return;
}

  // Show spinner and disable button
  document.getElementById('submit-button').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submit Payment';
  document.getElementById('submit-button').disabled = true;

  const selectedCurrencyButton = document.querySelector('.currency-button.active input');
  const selectedCurrency = selectedCurrencyButton ? selectedCurrencyButton.value : 'EUR';

  let priceId;
  if (selectedCurrency === 'EUR') {
    console.log("eur");
    priceId = Meteor.settings.public.PRICE_ID_EUR;
  } else if (selectedCurrency === 'USD') {
    console.log("usd");
    priceId = Meteor.settings.public.PRICE_ID_USD;
  }

  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
  });

  if (error) {
    console.log("Error occurred:", error);

    // Hide spinner and enable button
    document.getElementById('submit-button').innerHTML = 'Submit Payment';
    document.getElementById('submit-button').disabled = false;
    return;
  }

  Meteor.call('createSubscription', paymentMethod.id, priceId, async (err, clientSecret) => {
    if (err) {
      console.log("Server-side error:", err);

      // Hide spinner and enable button
      document.getElementById('submit-button').innerHTML = 'Submit Payment';
      document.getElementById('submit-button').disabled = false;
      return;
    }

    if (clientSecret) {
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
      if (confirmError) {
        console.log("3D Secure confirmation failed:", confirmError);

        // Hide spinner and enable button
        document.getElementById('submit-button').innerHTML = 'Submit Payment';
        document.getElementById('submit-button').disabled = false;
        return;
      } else {
        console.log("Subscription created with 3D Secure.");
        Meteor.call('updateUserToPaying');
        $("#checkoutModal").hide();
        $(".modal-backdrop").hide();
      }
    } else {
      console.log("Subscription created without 3D Secure.");
      Meteor.call('updateUserToPaying');
    }

    // Hide spinner and enable button
    document.getElementById('submit-button').innerHTML = 'Submit Payment';
    document.getElementById('submit-button').disabled = false;
  });
}

});

Template.body.events({
  'click #switchToEnglish': function() {
    TAPi18n.setLanguage('en')
      .done(function () {
        console.log("Language switched to English");

        // Save the preferred language in the database if user is logged in
        if (Meteor.userId()) {
          Meteor.call('updateLanguagePreference', 'en');
        } else {
          // Use a Session variable to temporarily store the language preference
          Session.set('preferredLanguage', 'en');
        }

      })
      .fail(function (error_message) {
        // console.log(error_message);
      });
  },
  'click #switchToFrench': function() {
    TAPi18n.setLanguage('fr')
      .done(function () {
        console.log("Language switched to French");

        // Save the preferred language in the database if user is logged in
        if (Meteor.userId()) {
          Meteor.call('updateLanguagePreference', 'fr');
        } else {
          // Use a Session variable to temporarily store the language preference
          Session.set('preferredLanguage', 'fr');
        }

      })
      .fail(function (error_message) {
        // console.log(error_message);
      });
  }
});
