using AutoMapper;
using CallToArms.Entities;
using CallToArms.Helpers;
using CallToArms.Models.Game;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms.Services
{
    public interface IGameService
    {
        Task<IEnumerable<GetGameDTO>> GetGames();
        Guid SetCover(IFormFile fichier, int gameId);
        Guid SetThumbnail(IFormFile fichier, int gameId);
    }

    public class GameService : IGameService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public GameService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<GetGameDTO>> GetGames()
        {
            var games = await this._context.Games.ToListAsync();
            return _mapper.Map<IEnumerable<GetGameDTO>>(games);
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