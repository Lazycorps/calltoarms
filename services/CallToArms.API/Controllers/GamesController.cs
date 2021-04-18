using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CallToArms.Entities;
using Microsoft.AspNetCore.Authorization;
using CallToArms.Filters;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using CallToArms.Models;
using CallToArms.Services;

namespace CallToArms.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GamesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IGameService _gameService;

        public GamesController(AppDbContext context, IGameService gameService)
        {
            _context = context;
            _gameService = gameService;
        }

        // GET: api/Games
        [HttpGet]
        public async Task<IActionResult> GetGames()
        {
            var games = await _gameService.GetGames();
            return Ok(games);
        }

        // GET: api/Games/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EntityGame>> GetGame(int id)
        {
            var game = await _context.Games.FindAsync(id);

            if (game == null)
            {
                return NotFound();
            }

            return game;
        }

        // PUT: api/Games/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutGame(int id, EntityGame game)
        {
            if (id != game.Id)
            {
                return BadRequest();
            }

            _context.Entry(game).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GameExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Games
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [ServiceFilter(typeof(AdminFilter))]
        public async Task<ActionResult<EntityGame>> PostGame(CreateGame createGame)
        {
            var existingGame = _context.Games.FirstOrDefault(u => u.Title == createGame.Title);

            if (existingGame != null)
            {
                return BadRequest("A game with that name already exists.");
            }

            var game = new EntityGame
            {
                Title = createGame.Title
            };

            _context.Games.Add(game);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetGame", new { id = game.Id }, game);
        }

        // DELETE: api/Games/5
        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<EntityGame>> DeleteGame(int id)
        {
            var game = await _context.Games.FindAsync(id);
            if (game == null)
            {
                return NotFound();
            }

            _context.Games.Remove(game);
            await _context.SaveChangesAsync();

            return game;
        }

        [HttpPost("SetCover/{gameId}")]
        [ServiceFilter(typeof(AdminFilter))]
        public ActionResult<string> SetCover(IFormFile file, int gameId)
        {
            var fichierEntete = this._gameService.SetCover(file, gameId);
            return Ok(fichierEntete);
        }

        [Authorize]
        [HttpPost("SetThumbnail/{gameId}")]
        public ActionResult<string> SetThumbnail(IFormFile file, int gameId)
        {
            var fichierEntete = this._gameService.SetThumbnail(file, gameId);
            return Ok(fichierEntete);
        }

        private bool GameExists(int id)
        {
            return _context.Games.Any(e => e.Id == id);
        }
    }
}
