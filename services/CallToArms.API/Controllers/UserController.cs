using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CallToArms.Models;
using CallToArms.Services;
using Microsoft.AspNetCore.Mvc;

namespace CallToArms.Controllers
{   
		// Controller used to perform actions 
		// on the currently logged in user with the JWT token
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService ;
        public UserController(IUserService userService) {
            _userService = userService;
        }

        [HttpGet]
        public ActionResult<AuthenticatedUser> Get()
        {
            var userId = User.Claims.ElementAt(0).Value;
            AuthenticatedUser user = _userService.GetUser(int.Parse(userId));

            return Ok(user);
        }
    }
}