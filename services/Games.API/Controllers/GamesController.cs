using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Games.API.Database;
using Games.API.Services;
using Games.API.Models;
using Games.API.Database.Entities;
using System.Net;

namespace Games.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GamesController : ControllerBase
    {
        private readonly GamesContext _context;
        private readonly IGameService _gameService;

        public GamesController(GamesContext context, IGameService gameService)
        {
            _context = context;
            _gameService = gameService;
        }

        // GET: api/Games
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<GameListItem>), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetGames()
        {
            var games = await _gameService.GetGames();
            return Ok(games);
        }

        // GET: api/Games/5
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(Game), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<Game>> GetGame(int id)
        {
            var game = await _gameService.Get(id);

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
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.Created)]
        public async Task<IActionResult> PutGame(int id, Game game)
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

            return CreatedAtAction(nameof(GetGame), new { id = game.Id }, null);
        }

        // POST: api/Games
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        [ProducesResponseType((int)HttpStatusCode.Created)]
        //[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        //[ServiceFilter(typeof(AdminFilter))]
        public async Task<ActionResult<Game>> PostGame(Game createGame)
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

            return CreatedAtAction(nameof(GetGame), new { id = game.Id }, null);
        }

        // DELETE: api/Games/5
        [HttpDelete("{id}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        //[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<EntityGame>> DeleteGame(int id)
        {
            var game = await _context.Games.FindAsync(id);
            if (game == null)
            {
                return NotFound();
            }

            _context.Games.Remove(game);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("SetCover/{gameId}")]
        //[ServiceFilter(typeof(AdminFilter))]
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
