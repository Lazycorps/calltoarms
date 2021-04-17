using AutoMapper;
using Games.API.Database;
using Games.API.Database.Entities;
using Games.API.Halpers;
using Games.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Games.API.Services
{
    public interface IGameService
    {
        Task<IEnumerable<GameListItem>> GetGames();
        Task<Game> Get(int id);
        Guid SetCover(IFormFile fichier, int gameId);
        Guid SetThumbnail(IFormFile fichier, int gameId);
    }

    public class GameService : IGameService
    {
        private readonly GamesContext _context;
        private readonly IMapper _mapper;

        public GameService(GamesContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GameListItem>> GetGames()
        {
            var games = await this._context.Games.ToListAsync();
            return _mapper.Map<IEnumerable<GameListItem>>(games);
        }

        public async Task<Game> Get(int id)
        {
            var game = await this._context.Games.FindAsync(id);
            return _mapper.Map<Game>(game);
        }

        public Guid SetCover(IFormFile file, int gameId)
        {
            var game = this._context.Games.FirstOrDefault(g => g.Id == gameId);
            if (game == null) throw new AppException($"Game {gameId} not found", 404);
            else
            {
                var idFichier = this.SaveFile(file);
                game.Cover = idFichier;
                this._context.SaveChanges();
                return idFichier;
            }
        }

        public Guid SetThumbnail(IFormFile file, int gameId)
        {
            var game = this._context.Games.FirstOrDefault(g => g.Id == gameId);
            if (game == null) throw new AppException($"Game {gameId} not found", 404);
            else
            {
                var idFichier = this.SaveFile(file);
                game.Thumbnail = idFichier;
                this._context.SaveChanges();
                return idFichier;
            }
        }

        private Guid SaveFile(IFormFile file)
        {
            var fileName = Path.GetFileName(file.FileName);
            var fileExtension = Path.GetExtension(fileName);

            var fichier = new EntityFile()
            {
                Extension = fileExtension,
                CreationDate = DateTime.Now,
            };

            using (var target = new MemoryStream())
            {
                file.CopyTo(target);
                fichier.File = target.ToArray();
            }

            this._context.Files.Add(fichier);
            this._context.SaveChanges();
            return fichier.Id;
        }
    }
}