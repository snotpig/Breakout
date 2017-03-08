using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Breakout.Models;
using System.IO;
using System.Xml.Serialization;

namespace BOTests
{
    [TestClass]
    public class UnitTest1
    {
        [TestMethod]
        public void CanSaveHiScore()
        {
            var hiscores = new HiScores();
            string FILENAME = Path.GetFullPath("..\\..\\HiScores\\HiScores.xml");
            if (File.Exists(FILENAME))
            {
                File.Delete(FILENAME);
            }
            HiScores.fileName = FILENAME;

            var hs = new HiScore()
            {
                Name = "Bob",
                Score = 99,
                IPaddr = "123",
                Time = new DateTime(123456)
            };
            hiscores.addScore(hs);

            XmlSerializer writer = new XmlSerializer(typeof(HiScores.SaveObject));
            using (var fs = new FileStream(FILENAME, FileMode.Open))
            {
                var so = ((HiScores.SaveObject)writer.Deserialize(fs));
                var scores = so.scores;
                Assert.AreEqual("Bob", scores[0].Name);
                Assert.AreEqual(99, scores[0].Score);
                Assert.AreEqual("123", scores[0].IPaddr);
                Assert.AreEqual(123456, scores[0].Time.Ticks);
            }
        }
    }
}
