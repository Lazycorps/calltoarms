using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CallToArms.Entities;
using CallToArms.Models;
using Microsoft.AspNetCore.Identity;
using CallToArms.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace CallToArms.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IUserService _userService;

        public UsersController(AppDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        // GET: api/Users
        [HttpGet]
        public ActionResult<IEnumerable<User>> GetUsers([FromQuery] string query, int limit = 10)
        {
            if(query != null) {
                return Ok(_userService.AutocompleteUsers(query.ToLower(), limit));
            }else{
                return Ok(_userService.GetAllUsers());
            }
        }

        [HttpGet]
        [Route("{id}")]
        public ActionResult<AuthenticatedUser> GetUser(int id){
            return Ok(_userService.GetUser(id));
        }

        // POST: api/Users
        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<AuthenticatedUser>> PostUser(RegisterUser registerUser)
        {
            var existingUser = _context.Users.FirstOrDefault(u => u.Email == registerUser.Email);

            if (existingUser != null)
            {
                return BadRequest("Email already in use");
            }

            var user = new User
            {
                Email = registerUser.Email,
                Password = registerUser.Password,
                Username = registerUser.Username
            };
            var passwordHasher = new PasswordHasher<User>();

            user.Password = passwordHasher.HashPassword(user, user.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            UserCredentials credentials = new UserCredentials
            {
                Login = registerUser.Email,
                Password = registerUser.Password
            };

            var authentication = _userService.Authenticate(credentials);

            Response.Headers.Add("Access-Token", authentication.token);

            return Ok(authentication.authenticatedUser);
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Authenticate([FromBody] UserCredentials userCredentials)
        {
            var response = _userService.Authenticate(userCredentials);

            if (response.authenticatedUser == null) return BadRequest(new { message = "Invalid credentials" });

            Response.Headers.Add("Access-Token", response.token);

            return Ok(response.authenticatedUser);
        }

    }
}
