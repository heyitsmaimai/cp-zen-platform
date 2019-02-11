'use strict';

angular.module('cpZenPlatform').factory('userUtils',
['$location', '$window', '$translate', '$state', '$rootScope', 'cdDojoService',
  'cdUsersService', 'auth', 'usSpinnerService', 'alertService', 'permissionService', 'Analytics',
  function($location, $window, $translate, $state, $rootScope, cdDojoService,
     cdUsersService, auth, usSpinnerService, alertService, permissionService, Analytics){
  var userUtils = {};

  var approvalRequired = ['mentor', 'champion'];

  userUtils.getAge = function (birthDate) {
    return moment.utc().diff(moment(birthDate), 'years');
  };

  userUtils.getBaseUserTypeByAge = function (birthDate) {
    var age = this.getAge(birthDate);
    if (age < 13) {
      return 'attendee-u13';
    } else if (age < 18) {
      return 'attendee-o13';
    } else {
      return 'parent-guardian';
    }
  };

  userUtils.doRegister = function (userFormData) {
    if(!userFormData.recaptchaResponse) return alertService.showError($translate.instant('Please resolve the captcha'));
    delete userFormData.passwordConfirm;
    var isAdult = false;

    userFormData.user['g-recaptcha-response'] = userFormData.recaptchaResponse;
    userFormData.user.emailSubject = 'Welcome to Zen, the CoderDojo community platform.';

    if (this.getAge(userFormData.profile.dob) >= 18) {
      userFormData.user.initUserType = {'title':'Parent/Guardian','name':'parent-guardian'};
      isAdult = true;
    } else if (this.getAge(userFormData.profile.dob) >= 13) {
      userFormData.user.initUserType = {'title':'Youth Over 13','name':'attendee-o13'};
    } else {
      return alertService.showError($translate.instant('Sorry only users over 13 can signup, but your parent or guardian can sign up and create you an account'));
    }
    var user = userFormData.user;
    auth.register(_.omit(userFormData, 'referer'), function(data) {
      Analytics.trackEvent($state.current.name, 'click', 'register' + (isAdult ? '_adult' : '_kid'));
      userFormData.referer = userFormData.referer && userFormData.referer.indexOf("/dashboard/") === -1 ? '/dashboard' + userFormData.referer : userFormData.referer;
      if(data.ok) {
        auth.login({ email: user.email, password: user.password }, function(data) {
          var initUserTypeStr = data.user && data.user.initUserType;
          var initUserType = JSON.parse(initUserTypeStr);
          if($state.current.name === 'start-dojo'){
            $window.location.href = $state.href('start-dojo');
          } else {
            // We cannot use $state.go until we find a solution to update the user menu
            // EventId is having its own redirection, don't cumulate w/ referer
            var params = {userId: data.user.id};
            if ($state.params.eventId) {
              params.eventId = $state.params.eventId;
            } else if (userFormData.referer) {
              params.referer = userFormData.referer;
            }
            // Note GFE 2019/02/08: replace default navigation to home
            // eventId can be ignored as all flows goes through Vuejs 
            // Other referers might be in use: accepting an invite
            $window.location.href = params.referer ? params.referer : '/home'; 
          }
        });
      } else {
        var reason;

        if(data.why === 'nick-exists'){
          reason = $translate.instant('user name already exists');
        }

        if(data.error === 'captcha-failed'){
          reason = $translate.instant('captcha error');
        }

        alertService.showAlert($translate.instant('There was a problem registering your account:') + ' ' + reason);
      }
    }, function(err) {
      alertService.showError(JSON.stringify(err));
    });
  };

  userUtils.defaultAvatar = function (usertype, sex) {
    var overallDefault = '/img/avatars/avatar.png';
    var defaults = {
      'attendee-o13': {
        default: '/img/avatars/ninja.png',
        'Female': ['/img/avatars/kid-f.png', '/img/avatars/kid-f2.png'],
        'Male': ['/img/avatars/kid-m.png', '/img/avatars/kid-m2.png', '/img/avatars/kid-m3.png']
      },
      'attendee-u13':{
        default: '/img/avatars/ninja.png',
        'Female': ['/img/avatars/kid-f.png', '/img/avatars/kid-f2.png'],
        'Male': ['/img/avatars/kid-m.png', '/img/avatars/kid-m2.png', '/img/avatars/kid-m3.png']
      },
      'adult': {
        default: '/img/avatars/avatar.png',
        'Female': ['/img/avatars/adult-f.png', '/img/avatars/adult-f2.png', '/img/avatars/adult-f3.png', '/img/avatars/adult-f4.png', '/img/avatars/adult-f5.png'],
        'Male': ['/img/avatars/adult-m.png', '/img/avatars/adult-m2.png']
      }
    };
    var avatar = void 0;
    var userTypeAvatar = defaults[usertype];
    if (_.includes(['mentor', 'parent-guardian', 'champion'], usertype)) {
      userTypeAvatar = defaults.adult;
    }
    if (userTypeAvatar) {
      if(sex) {
        avatar = _.sample(userTypeAvatar[sex]);
      } else {
        avatar = _.sample(_.concat(userTypeAvatar.Female, userTypeAvatar.Male));
      }
    }
    return  avatar || overallDefault;
  }

  /**
   * getTitleForUserTypes Return a title based upon usertypes of a user
   * @param  {Array} userTypes  List of userTypes/roles
   * @param  {Object} user      The user profile
   * @return {String}           The title (ie : Youth Champion, Ninja)
   */
  userUtils.getTitleForUserTypes = function (userTypes, user) {
    var title = [];
    var age = this.getAge(user.dob);

    if (_.includes(userTypes, 'champion')) {
      title.push($translate.instant('Champion'));
    } else if (_.includes(userTypes, 'mentor')) {
      title.push($translate.instant('Volunteer/Mentor'));
    }

    if (age < 18 || _.includes(userTypes, 'attendee-u13') || _.includes(userTypes, 'attendee-o13')) {
      if (title.length === 0) {
        title.push($translate.instant('Attendee'));
      } else {
        // so we have "Youth Mentor" rather than "Attendee Mentor"
        title.unshift($translate.instant('Youth'))
      }
      title.push('(' + age + ')');
    } else if (title.length === 0) {
      title.push($translate.instant('Parent/Guardian'));
    }

    return title.join(' ');
  }

  userUtils.getPermissionsForUserTypes = function (userTypes, userDojo) {
    var def = {
      // name: array since we're using concat to have a one-level array
      'champion': [{"title":"Dojo Admin","name":"dojo-admin"},
       {"title":"Ticketing Admin","name":"ticketing-admin"}]
    };
    var perms;
    // If original perm is lower than the new one, we reset it, else we expand it
    if (permissionService.getUserTypesIndex(userDojo.userTypes) < permissionService.getUserTypesIndex(userTypes) ||
      !userDojo.userPermissions) {
      perms = [];
    } else {
      perms = userDojo.userPermissions;
    }
    userTypes.forEach(function (usertype) {
      if (def[usertype]) {
        perms = perms.concat(def[usertype]);
      }
    });
    return _.uniqBy(perms, 'name');
  }

  return userUtils;
}]);
