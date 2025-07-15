using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CommonDbLib.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEstimateStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "State",
                table: "EstimateSheetLv1s",
                newName: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "EstimateSheetLv1s",
                newName: "State");
        }
    }
}
