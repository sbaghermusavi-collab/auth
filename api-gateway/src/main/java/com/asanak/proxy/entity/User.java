package com.asanak.proxy.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.Immutable;

@Data
@Entity
@Immutable
@Table(name = "us_user")
public class User {
    @Id
    private Integer id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String profileType;
}
