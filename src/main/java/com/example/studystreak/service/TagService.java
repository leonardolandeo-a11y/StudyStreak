package com.example.studystreak.service;


import com.example.studystreak.dto.Tag.TagDTO;
import com.example.studystreak.model.Tag;
import com.example.studystreak.repository.TagRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class TagService {
    //private final: variable privada e inmutable
    private final TagRepository tagRepository;
    private final ModelMapper modelMapper;
    //autowired se encarga de gestionar la inyeccion de dependencias
    @Autowired
    public TagService(TagRepository tagRepository, ModelMapper modelMapper) {
        this.tagRepository = tagRepository;
        this.modelMapper = modelMapper;
    }
    public TagDTO createTag(TagDTO tagDTO) {
        Tag tag = modelMapper.map(tagDTO, Tag.class);
        // Es más seguro trabajar con la tag guardada en la base de datos
        Tag savedTag = tagRepository.save(tag);
        return modelMapper.map(savedTag, TagDTO.class);
    }
    public List<TagDTO> getAllTags() {
        List<Tag> tags = tagRepository.findAll();
        List<TagDTO> tagDTOs = new ArrayList<>();
        for (Tag tag : tags) {
            tagDTOs.add(modelMapper.map(tag, TagDTO.class));
        }
        return  tagDTOs;
    }
    public TagDTO getTagById(Long tagId) {
        Tag tag = tagRepository.findById(tagId).orElseThrow(); //el error handling lo implementare algun dia
        return modelMapper.map(tag,TagDTO.class); //se mapea a dto
    }
    public TagDTO updateTag(Long tagId, TagDTO tagDTO) {
        Tag tag = tagRepository.findById(tagId).orElseThrow();
        tag.setName(tagDTO.getName());
        Tag updatedTag = tagRepository.save(tag);
        return modelMapper.map(updatedTag,TagDTO.class);
    }
    public void deleteTag(Long tagId) {
        Tag tag = tagRepository.findById(tagId).orElseThrow();
        tagRepository.delete(tag);
    }
}
