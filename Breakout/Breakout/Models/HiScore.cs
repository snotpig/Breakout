using System;
namespace Breakout.Models
{
    public class HiScore
    {
        public string Name { get; set; }
        public int Score { get; set; }
        public string IPaddr { get; set; }
        public DateTime Time { get; set; }
    }
}