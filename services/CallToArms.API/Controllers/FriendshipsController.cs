using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CallToArms.Entities;
using CallToArms.Models.Friendship;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CallToArms.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FriendshipsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public FriendshipsController(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;

        }

        [HttpPost]
        public IActionResult CreateFriendship([FromBody] int friendId)
        {
            int userId = GetUserId();

            if (friendId == userId) return StatusCode(422, "Can't add yourself as a friend. That makes no sense !");
            if (FriendshipExists(friendId, userId)) return Conflict("This friendship already exists");

            Friendship newFriendship = new Friendship()
            {
                FriendId = friendId,
                SenderId = GetUserId(),
            };

            _context.Friendships.Add(newFriendship);
            _context.SaveChanges();

            return StatusCode(201, "Created");
        }

        [HttpPut]
        public IActionResult UpdateFriendship([FromBody] FriendshipUpdateDTO updatedFriendship)
        {
            int userId = GetUserId();
            Friendship friendship = _context.Friendships.FirstOrDefault(f => f.SenderId == userId && f.FriendId == updatedFriendship.FriendId);

            if (friendship == null) return NotFound("Record not found");

            friendship.Status = updatedFriendship.Status;

            if (friendship.Status == "accepted")
            {
                Friendship reverseFriendship = _context.Friendships.FirstOrDefault(f => f.FriendId == userId && f.SenderId == friendship.FriendId);
                if (reverseFriendship != null)
                {
                    reverseFriendship.Status = "accepted";
                }
                else
                {
                    reverseFriendship = new Friendship()
                    {
                        SenderId = friendship.FriendId,
                        FriendId = userId,
                        Status = "accepted"
                    };
                    _context.Friendships.Add(reverseFriendship);
                }

            }
            _context.SaveChanges();

            return Ok("Updated");
        }

        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue("id"));

        private bool FriendshipExists(int friendId, int userId)
        {
            return _context.Friendships.Any(f => f.FriendId == friendId && f.SenderId == userId);
        }
    }
}
