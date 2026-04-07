using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace HyderabadiRestaurant.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        // GET: api/Menu
        [HttpGet]
        public IActionResult Get()
        {
            var menu = new List<MenuItem>
            {
                new MenuItem
                {
                    Id = 1,
                    Name = "Chicken Biryani",
                    Category = "Main Course",
                    Price = 12,
                    ImageUrl = "/images/chicken-biryani.jpg"
                },
                new MenuItem
                {
                    Id = 2,
                    Name = "Mutton Biryani",
                    Category = "Main Course",
                    Price = 15,
                    ImageUrl = "/images/mutton-biryani.jpg"
                },
                new MenuItem
                {
                    Id = 3,
                    Name = "Haleem",
                    Category = "Special",
                    Price = 10,
                    ImageUrl = "/images/haleem.jpg"
                },
                new MenuItem
                {
                    Id = 4,
                    Name = "Chicken 65",
                    Category = "Starter",
                    Price = 8,
                    ImageUrl = "/images/chicken-65.jpg"
                }
            };

            return Ok(menu);
        }
    }

    // ✅ Model
    public class MenuItem
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; }
        public int Price { get; set; }
        public string ImageUrl { get; set; }
    }
}