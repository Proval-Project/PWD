using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CommonDbLib.Migrations
{
    /// <inheritdoc />
    public partial class AddTagNoColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TagNo",
                table: "DataSheetLv3s",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TagNo",
                table: "DataSheetLv3s");
        }
    }
}
