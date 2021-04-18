using AutoMapper;
using CallToArms.Entities;
using CallToArms.Models;
using CallToArms.Models.Game;
using CallToArms.Models.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CallToArms
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            CreateMap<User, AuthenticatedUser>()
                .ForMember(dto => dto.Games, u => u.MapFrom(u => u.GameUsers.Select(gu => gu.Game)))
                .ForMember(dto => dto.UserFirebaseTokens, u => u.MapFrom(u => u.UserFirebaseTokens.Select(token => token.FirebaseToken)));
            // CreateMap<Game, GetGameDto>();
            //     .ForMember(dto => dto.Games, u => u.MapFrom(u => u.GameUsers.Select(gu => gu.Game)));
            CreateMap<EntityGame, GetGameDTO>();
            CreateMap<Friendship, GetFriendshipDto>()
                .ForMember(dto => dto.FriendId, f => f.MapFrom(u => u.Friend.Id))
                .ForMember(dto => dto.FriendUsername, f => f.MapFrom(u => u.Friend.Username));
            CreateMap<Notification, GetNotification>()
                .ForMember(dto => dto.SenderUsername, s => s.MapFrom(n => n.Sender.Username))
                .ForMember(dto => dto.ReceiverUsername, s => s.MapFrom(n => n.Receiver.Username));
            CreateMap<User, GetUser>();
            CreateMap<CreateNotification, Notification>();
        }
    }
}
