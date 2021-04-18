using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CallToArms.Entities;
using Microsoft.AspNetCore.Authorization;
using CallToArms.Models.GameUser;
using System.Security.Claims;

namespace CallToArms.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class GameUsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GameUsersController(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;

        }

        // GET: api/GameUsers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GameUser>>> GetGameUsers()
        {
            return await _context.GameUsers.ToListAsync();
        }

        // GET: api/GameUsers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GameUser>> GetGameUser(int id)
        {
            var gameUser = await _context.GameUsers.FindAsync(id);

            if (gameUser == null)
            {
                return NotFound();
            }

            return gameUser;
        }

        // PUT: api/GameUsers/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        //[HttpPut("{id}")]
        //public async Task<IActionResult> PutGameUser(int id, GameUser gameUser)
        //{
        //    if (id != gameUser.GameId)
        //    {
        //        return BadRequest();
        //    }

        //    _context.Entry(gameUser).State = EntityState.Modified;

        //    try
        //    {
        //        await _context.SaveChangesAsync();
        //    }
        //    catch (DbUpdateConcurrencyException)
        //    {
        //        if (!GameUserExists(id))
        //        {
        //            return NotFound();
        //        }
        //        else
        //        {
        //            throw;
        //        }
        //    }

        //    return NoContent();
        //}

        // POST: api/GameUsers
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<GameUser>> PostGameUser(AddGameUser newGameUser)
        {
            GameUser gameUser = new GameUser
            {
                GameId = newGameUser.GameId,
                UserId = GetUserId()
            };

            

            _context.GameUsers.Add(gameUser);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (GameUserExists(gameUser.GameId, gameUser.UserId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetGameUser", new { id = gameUser.GameId }, gameUser);
        }

        // DELETE: api/GameUsers/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<GameUser>> DeleteGameUser(int id)
        {
            var gameUser = await _context.GameUsers.FindAsync(id);
            if (gameUser == null)
            {
                return NotFound();
            }

            _context.GameUsers.Remove(gameUser);
            await _context.SaveChangesAsync();

            return gameUser;
        }

        private bool GameUserExists(int gameId, int userId)
        {
            return _context.GameUsers.Any(e => e.GameId == gameId && e.UserId == userId);
        }

        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue("id"));
    }
}
