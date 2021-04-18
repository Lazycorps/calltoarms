using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace CallToArms.Migrations
{
    public partial class AddLoggingEntityGame : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreationDate",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "ModificationDate",
                table: "Games");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateCreation",
                table: "Games",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DateModification",
                table: "Games",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateCreation",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "DateModification",
                table: "Games");

            migrationBuilder.AddColumn<int>(
                name: "CreationDate",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ModificationDate",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
