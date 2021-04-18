using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CallToArms.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CallToArms.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserFirebaseTokensController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserFirebaseTokensController(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpPost]
        public IActionResult Create([FromBody] string firebaseToken)
        {
            int userId = GetUserId();
            bool alreadyExists = _context.UserFirebaseTokens.Any(uft => uft.UserId == userId && uft.FirebaseToken == firebaseToken);
            if (alreadyExists) return StatusCode(422, "Record already exists");
            UserFirebaseToken newToken = new UserFirebaseToken()
            {
                UserId = userId,
                FirebaseToken = firebaseToken
            };

            _context.UserFirebaseTokens.Add(newToken);
            _context.SaveChanges();

            return StatusCode(201);
        }

        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue("id"));
    }
}
