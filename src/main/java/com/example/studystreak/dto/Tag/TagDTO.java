package com.example.studystreak.dto.Tag;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TagDTO {
    //necesario para metodos como getTagbyId
    private Long Id;
    private String name;

    protected TagDTO(){}
}
