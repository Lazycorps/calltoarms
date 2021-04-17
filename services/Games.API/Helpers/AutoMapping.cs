using AutoMapper;
using Games.API.Database.Entities;
using Games.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Games.API.Helpers
{
    public class AutoMapping : Profile
    {
        public AutoMapping()
        {
            CreateMap<EntityGame, Game>();
            CreateMap<EntityGame, GameListItem>();
        }
    }
}
