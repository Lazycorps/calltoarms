using Games.API.Database.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Games.API.Database
{
    public class GamesContext : DbContext
    {
        public GamesContext(DbContextOptions options)
                : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("games");
            modelBuilder.Entity<EntityGame>().HasIndex(g => g.Title).IsUnique();
        }

        public DbSet<EntityGame> Games { get; set; }
        public DbSet<EntityFile> Files { get; set; }
    }
}
