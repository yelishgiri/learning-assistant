require("dotenv").config();
const prisma = require("../lib/prisma");
const path = require("path");
const fs = require("fs");

// Music generation logic based on study material analysis
const analyzeStudyMaterial = (files) => {
  if (!files || files.length === 0) {
    return {
      studyType: 'general',
      musicType: 'ambient',
      description: 'General study music for focus and concentration',
      tags: 'ambient, instrumental, calm, focus'
    };
  }

  // Analyze file names and extensions to determine study type
  const fileNames = files.map(file => file.name.toLowerCase());
  const extensions = files.map(file => path.extname(file.name).toLowerCase());
  
  // Keywords for different study types
  const memorizationKeywords = ['vocab', 'vocabulary', 'memorize', 'flashcard', 'definition', 'formula', 'equation', 'date', 'history'];
  const analyticalKeywords = ['math', 'physics', 'chemistry', 'engineering', 'problem', 'solution', 'calculation', 'algorithm', 'code'];
  const creativeKeywords = ['essay', 'writing', 'creative', 'art', 'design', 'project', 'presentation', 'brainstorm'];
  
  // Count matches for each study type
  let memorizationScore = 0;
  let analyticalScore = 0;
  let creativeScore = 0;
  
  fileNames.forEach(fileName => {
    memorizationKeywords.forEach(keyword => {
      if (fileName.includes(keyword)) memorizationScore++;
    });
    analyticalKeywords.forEach(keyword => {
      if (fileName.includes(keyword)) analyticalScore++;
    });
    creativeKeywords.forEach(keyword => {
      if (fileName.includes(keyword)) creativeScore++;
    });
  });

  // Determine primary study type
  let studyType, musicType, description, tags;
  
  if (memorizationScore > analyticalScore && memorizationScore > creativeScore) {
    studyType = 'memorization';
    musicType = 'ambient';
    description = 'Ambient music for memorization and rote learning';
    tags = 'ambient, instrumental, minimalist, calm, focus, no lyrics, lo-fi';
  } else if (analyticalScore > creativeScore) {
    studyType = 'analytical';
    musicType = 'baroque';
    description = 'Baroque classical music for analytical problem-solving';
    tags = 'baroque classical, instrumental, structured, mathematical, bach, vivaldi, focus';
  } else if (creativeScore > 0) {
    studyType = 'creative';
    musicType = 'cinematic';
    description = 'Cinematic music for creative thinking and inspiration';
    tags = 'cinematic, instrumental, inspiring, dynamic, post-rock, creative, uplifting';
  } else {
    studyType = 'general';
    musicType = 'ambient';
    description = 'General study music for focus and concentration';
    tags = 'ambient, instrumental, calm, focus, lo-fi, chill';
  }

  return { studyType, musicType, description, tags };
};

// Generate music using Suno API
const generateMusic = async (req, res) => {
  try {
    console.log('Music generation request for folder ID:', req.params.id);
    const folderId = Number(req.params.id);
    
    // Get folder and its files
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true }
    });
    
    if (!folder) {
      return res.status(404).send("Folder not found");
    }

    // Analyze study materials to determine music type
    const analysis = analyzeStudyMaterial(folder.files);
    console.log('Study analysis:', analysis);

    // Generate music using Suno API
    const sunoResponse = await fetch('https://studio-api.prod.suno.com/api/v2/external/hackmit/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `${analysis.description} for studying ${folder.name}`,
        tags: analysis.tags,
        make_instrumental: true
      })
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      console.error('Suno API error:', errorText);
      return res.status(500).send("Error generating music: " + errorText);
    }

    const sunoData = await sunoResponse.json();
    console.log('Suno generation started:', sunoData.id);

    // Create initial queue with this track
    const initialQueue = [{
      id: sunoData.id,
      status: 'generating',
      title: '',
      audioUrl: '',
      imageUrl: '',
      type: analysis.musicType,
      description: analysis.description,
      createdAt: new Date()
    }];

    // Store the generation request in database with queue
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        musicClipId: sunoData.id,
        musicStatus: 'generating',
        musicType: analysis.musicType,
        musicDescription: analysis.description,
        musicQueue: initialQueue,
        currentTrackIndex: 0,
        isQueueActive: true
      }
    });

    // Start generating next track in background (with delay to avoid rate limits)
    setTimeout(() => {
      generateNextTrack(folderId, analysis);
    }, 5000); // 5 second delay

    res.json({
      success: true,
      clipId: sunoData.id,
      message: 'Music generation started! Check back in a minute.',
      analysis: analysis,
      queueActive: true
    });

  } catch (error) {
    console.error('Music generation error:', error);
    res.status(500).send("Error generating music: " + error.message);
  }
};

// Check music generation status and get audio URL
const getMusicStatus = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicClipId) {
      return res.status(404).send("No music generation found for this folder");
    }

    // Check status with Suno API
    const sunoResponse = await fetch(`https://studio-api.prod.suno.com/api/v2/external/hackmit/clips?ids=${folder.musicClipId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`
      }
    });

    if (!sunoResponse.ok) {
      return res.status(500).send("Error checking music status");
    }

    const clips = await sunoResponse.json();
    const clip = clips[0];

    if (!clip) {
      return res.status(404).send("Music clip not found");
    }

    // Update folder with current status
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        musicStatus: clip.status,
        musicTitle: clip.title || '',
        musicAudioUrl: clip.audio_url || '',
        musicImageUrl: clip.image_url || ''
      }
    });

    res.json({
      status: clip.status,
      title: clip.title,
      audioUrl: clip.audio_url,
      imageUrl: clip.image_url,
      metadata: clip.metadata
    });

  } catch (error) {
    console.error('Music status check error:', error);
    res.status(500).send("Error checking music status: " + error.message);
  }
};

// Get current music for a folder
const getFolderMusic = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return res.status(404).send("Folder not found");
    }

    res.json({
      hasMusic: !!folder.musicClipId,
      status: folder.musicStatus,
      title: folder.musicTitle,
      audioUrl: folder.musicAudioUrl,
      imageUrl: folder.musicImageUrl,
      musicType: folder.musicType,
      description: folder.musicDescription
    });

  } catch (error) {
    console.error('Get folder music error:', error);
    res.status(500).send("Error getting folder music: " + error.message);
  }
};

// Generate next track in queue (background function)
const generateNextTrack = async (folderId, analysis) => {
  try {
    console.log('Generating next track for folder:', folderId);
    
    // Generate next track using Suno API
    const sunoResponse = await fetch('https://studio-api.prod.suno.com/api/v2/external/hackmit/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `${analysis.description} for studying - variation`,
        tags: analysis.tags,
        make_instrumental: true
      })
    });

    if (!sunoResponse.ok) {
      console.error('Failed to generate next track');
      return;
    }

    const sunoData = await sunoResponse.json();
    console.log('Next track generation started:', sunoData.id);

    // Add to queue
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (folder && folder.musicQueue) {
      const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
      queue.push({
        id: sunoData.id,
        status: 'generating',
        title: '',
        audioUrl: '',
        imageUrl: '',
        type: analysis.musicType,
        description: analysis.description,
        createdAt: new Date()
      });

      await prisma.folder.update({
        where: { id: folderId },
        data: { musicQueue: queue }
      });
    }
  } catch (error) {
    console.error('Error generating next track:', error);
  }
};

// Skip to next track
const skipNext = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      return res.status(400).send("No next track available");
    }

    // Update current track index
    await prisma.folder.update({
      where: { id: folderId },
      data: { currentTrackIndex: nextIndex }
    });

    const nextTrack = queue[nextIndex];
    res.json({
      success: true,
      track: nextTrack,
      currentIndex: nextIndex,
      totalTracks: queue.length
    });

  } catch (error) {
    console.error('Skip next error:', error);
    res.status(500).send("Error skipping to next track: " + error.message);
  }
};

// Skip to previous track
const skipPrevious = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      return res.status(400).send("No previous track available");
    }

    // Update current track index
    await prisma.folder.update({
      where: { id: folderId },
      data: { currentTrackIndex: prevIndex }
    });

    const prevTrack = queue[prevIndex];
    res.json({
      success: true,
      track: prevTrack,
      currentIndex: prevIndex,
      totalTracks: queue.length
    });

  } catch (error) {
    console.error('Skip previous error:', error);
    res.status(500).send("Error skipping to previous track: " + error.message);
  }
};

// Get current track from queue
const getCurrentTrack = async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder || !folder.musicQueue) {
      return res.status(404).send("No music queue found");
    }

    const queue = Array.isArray(folder.musicQueue) ? folder.musicQueue : [];
    const currentIndex = folder.currentTrackIndex || 0;
    const currentTrack = queue[currentIndex];

    if (!currentTrack) {
      return res.status(404).send("No current track found");
    }

    res.json({
      success: true,
      track: currentTrack,
      currentIndex: currentIndex,
      totalTracks: queue.length,
      hasNext: currentIndex < queue.length - 1,
      hasPrevious: currentIndex > 0
    });

  } catch (error) {
    console.error('Get current track error:', error);
    res.status(500).send("Error getting current track: " + error.message);
  }
};

module.exports = {
  generateMusic,
  getMusicStatus,
  getFolderMusic,
  skipNext,
  skipPrevious,
  getCurrentTrack
};
